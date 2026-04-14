import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"];
type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
type InvitationInsert = Database["public"]["Tables"]["invitations"]["Insert"];

export const organizationService = {
  async createOrganization(data: {
    name: string;
    description?: string;
    ownerWalletAddress: string;
    ownerId: string;
  }): Promise<Organization> {
    const { data: org, error } = await supabase
      .from("organizations")
      .insert({
        name: data.name,
        description: data.description || null,
        wallet_address: data.ownerWalletAddress,
        owner_id: data.ownerId,
      } as OrganizationInsert)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return org;
  },

  async getOrganizationByCode(code: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("invite_code", code.toUpperCase())
      .single();

    if (error && error.code !== "PGRST116") throw new Error(error.message);
    return data;
  },

  async getOrganizationById(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw new Error(error.message);
    return data;
  },

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("organization_id")
      .eq("user_id", userId);

    if (rolesError) throw new Error(rolesError.message);

    const orgIds = roles?.map((r) => r.organization_id) || [];
    if (orgIds.length === 0) return [];

    const { data: orgs, error } = await supabase
      .from("organizations")
      .select("*")
      .in("id", orgIds);

    if (error) throw new Error(error.message);
    return orgs || [];
  },

  async createInvitation(data: {
    organizationId: string;
    role?: string;
    email?: string;
    createdBy: string;
  }): Promise<Invitation> {
    const code = generateInviteCode();
    const { data: invitation, error } = await supabase
      .from("invitations")
      .insert({
        organization_id: data.organizationId,
        code,
        role: data.role || "employee",
        email: data.email || null,
        status: "pending",
        created_by: data.createdBy,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      } as InvitationInsert)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return invitation;
  },

  async getInvitationByCode(code: string): Promise<Invitation | null> {
    const { data, error } = await supabase
      .from("invitations")
      .select(`
        *,
        organizations:organization_id (
          id,
          name,
          invite_code
        )
      `)
      .eq("code", code.toUpperCase())
      .single();

    if (error && error.code !== "PGRST116") throw new Error(error.message);
    return data;
  },

  async validateInvitation(code: string): Promise<{
    valid: boolean;
    organization?: { id: string; name: string };
    error?: string;
  }> {
    const invitation = await this.getInvitationByCode(code);
    
    if (!invitation) {
      return { valid: false, error: "Invalid invite code" };
    }

    if (invitation.status === "accepted" || invitation.status === "expired") {
      return { valid: false, error: "Invite code has already been used or expired" };
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return { valid: false, error: "Invite code has expired" };
    }

    return {
      valid: true,
      organization: {
        id: invitation.organization_id,
        name: (invitation.organizations as any)?.name || "Organization",
      },
    };
  },

  async acceptInvitation(code: string, userId: string, walletAddress: string): Promise<void> {
    const { error: updateError } = await supabase
      .from("invitations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("code", code.toUpperCase());

    if (updateError) throw new Error(updateError.message);

    const { data: invitation } = await supabase
      .from("invitations")
      .select("organization_id")
      .eq("code", code.toUpperCase())
      .single();

    if (!invitation) throw new Error("Invitation not found");

    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        organization_id: invitation.organization_id,
        user_id: userId,
        role: "employee",
      });

    if (roleError) throw new Error(roleError.message);
  },
};

function generateInviteCode(): string {
  return (
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

export default organizationService;