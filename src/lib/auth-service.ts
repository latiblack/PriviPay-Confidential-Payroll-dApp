import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
type Employee = Database["public"]["Tables"]["employees"]["Row"];

export interface UserProfile {
  id: string;
  walletAddress: string;
  displayName: string | null;
  organizations: Organization[];
  currentRole: "owner" | "employer" | "employee" | "staff" | "manager" | "auditor" | "pending" | null;
  currentOrganization: Organization | null;
}

const PROFILE_STORAGE_KEY = "privipay_user_profile";

export const authService = {
  // Save profile to localStorage for persistence
  saveProfile(profile: UserProfile): void {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  },

  // Load profile from localStorage
  loadProfile(): UserProfile | null {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Clear profile on logout
  clearProfile(): void {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  },

  // Get or create user profile based on wallet address
  async getOrCreateProfile(walletAddress: string): Promise<Profile> {
    const lowerAddress = walletAddress.toLowerCase();
    console.log("getOrCreateProfile for:", lowerAddress);
    
    // First try to find existing profile
    const { data: existing, error: findError } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", lowerAddress)
      .single();

    console.log("Existing profile:", existing, "error:", findError);

    if (existing) return existing;

    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        wallet_address: lowerAddress,
        display_name: null,
        user_id: lowerAddress,
      })
      .select()
      .single();

    if (createError) throw new Error(createError.message);
    return newProfile!;
  },

// Get user's organizations and role
async getUserOrganizationsAndRole(walletAddress: string): Promise<{
    organizations: Organization[];
    role: UserRole | null;
    isOwner: boolean;
  }> {
    console.log("getUserOrganizationsAndRole for:", walletAddress);
    
    // Check if user is owner of any organizations
    const { data: ownedOrgs, error: ownerError } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", walletAddress.toLowerCase());

    console.log("Owned orgs:", ownedOrgs, "error:", ownerError);

    if (ownerError && ownerError.code !== "PGRST116") {
      throw new Error(ownerError.message);
    }

    // If user owns orgs, they're an employer/owner
    if (ownedOrgs && ownedOrgs.length > 0) {
      // Return only the first org (most recent) for owners
      return {
        organizations: [ownedOrgs[0]],
        role: null,
        isOwner: true,
      };
    }

    // Check user_roles for membership (all roles except pending)
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select(`
        *,
        organizations:organization_id (*)
      `)
      .eq("user_id", walletAddress.toLowerCase())
      .neq("role", "pending");

    console.log("User roles:", roles, "error:", rolesError);

    if (rolesError) throw new Error(rolesError.message);

    if (roles && roles.length > 0) {
      const role = roles[0];
      return {
        organizations: roles.map((r: any) => r.organizations).filter(Boolean),
        role: role,
        isOwner: false,
      };
    }

    // Check for pending roles
    const { data: pendingRoles } = await supabase
      .from("user_roles")
      .select(`
        *,
        organizations:organization_id (*)
      `)
      .eq("user_id", walletAddress.toLowerCase())
      .eq("role", "pending");

    console.log("Pending roles:", pendingRoles);

    if (pendingRoles && pendingRoles.length > 0) {
      return {
        organizations: [],
        role: pendingRoles[0],
        isOwner: false,
      };
    }

return {
      organizations: [],
      role: null,
      isOwner: false,
    };
  },

  // Full login - load or create profile
  async login(walletAddress: string): Promise<UserProfile> {
    const lowerAddress = walletAddress.toLowerCase();
    
    // Get or create profile
    const profile = await this.getOrCreateProfile(lowerAddress);
    
    // Get organizations and role
    const { organizations, role, isOwner } = await this.getUserOrganizationsAndRole(lowerAddress);

    const userProfile: UserProfile = {
      id: profile.id,
      walletAddress: profile.wallet_address,
      displayName: profile.display_name,
      organizations,
      currentRole: isOwner ? "owner" : (role?.role as any) || null,
      currentOrganization: organizations[0] || null,
    };

    // Save to localStorage
    this.saveProfile(userProfile);

    return userProfile;
  },

  // Update user profile
  async updateProfile(walletAddress: string, updates: { displayName?: string }): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        display_name: updates.displayName,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Get employees for an organization (for employer view)
  async getOrganizationEmployees(orgId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("organization_id", orgId);

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Add employee to organization
  async addEmployee(data: {
    organizationId: string;
    walletAddress: string;
    name: string;
    position?: string;
    department?: string;
  }): Promise<Employee> {
    const { data: employee, error } = await supabase
      .from("employees")
      .insert({
        organization_id: data.organizationId,
        wallet_address: data.walletAddress,
        status: "active",
        position: data.position || null,
        department: data.department || null,
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return employee;
  },
};

export default authService;