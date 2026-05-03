import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"];
type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
type InvitationInsert = Database["public"]["Tables"]["invitations"]["Insert"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
type UserRoleInsert = Database["public"]["Tables"]["user_roles"]["Insert"];

function generateInviteCode(): string {
  return (
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

export const organizationService = {
  async createOrganization(data: {
    name: string;
    description?: string;
    ownerWalletAddress: string;
    ownerId: string;
  }): Promise<Organization> {
    // Use lowercase for wallet addresses for consistency
    const lowerOwnerId = data.ownerId.toLowerCase();
    const lowerWalletAddress = data.ownerWalletAddress.toLowerCase();
    
    const { data: org, error } = await supabase
      .from("organizations")
      .insert({
        name: data.name,
        description: data.description || null,
        wallet_address: lowerWalletAddress,
        owner_id: lowerOwnerId,
      } as OrganizationInsert)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Add owner to user_roles with 'employer' role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: lowerOwnerId,
        organization_id: org.id,
        role: "employer",
      } as UserRoleInsert);

    if (roleError) {
      console.error("Failed to add owner to user_roles:", roleError);
    }

    return org;
  },

  async updateContractInfo(orgId: string, contractAddress: string, txHash: string): Promise<void> {
    const { error } = await supabase
      .from("organizations")
      .update({
        contract_address: contractAddress.toLowerCase(),
        contract_tx_hash: txHash,
        contract_deployed_at: new Date().toISOString(),
      } as any)
      .eq("id", orgId);
    if (error) throw new Error(error.message);
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
    // First check if user owns any organizations
    const { data: ownedOrgs, error: ownerError } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", userId);

    if (ownerError && ownerError.code !== "PGRST116") throw new Error(ownerError.message);
    
    if (ownedOrgs && ownedOrgs.length > 0) {
      return ownedOrgs;
    }

    // Check user_roles for membership
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

  async getOrganizationInviteCode(orgId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("organizations")
      .select("invite_code")
      .eq("id", orgId)
      .single();

    if (error && error.code !== "PGRST116") return null;
    return data?.invite_code || null;
  },

  async findOrgByInviteCode(code: string): Promise<{ id: string; name: string } | null> {
    // Universal key - find org by invite code
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("invite_code", code.toUpperCase())
      .single();

    if (error && error.code !== "PGRST116") return null;
    return data ? { id: data.id, name: data.name } : null;
  },

  async regenerateInviteCode(orgId: string): Promise<string> {
    const newCode = generateInviteCode();
    
    const { data, error } = await supabase
      .from("organizations")
      .update({ invite_code: newCode })
      .eq("id", orgId)
      .select("invite_code")
      .single();

    if (error) throw new Error(error.message);
    return data?.invite_code || newCode;
  },

  async getPendingInvitations(orgId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "pending");

    if (error) throw new Error(error.message);
    return data || [];
  },

  async approveInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);

    if (error) throw new Error(error.message);
  },

  async rejectInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from("invitations")
      .update({ status: "rejected" })
      .eq("id", invitationId);

    if (error) throw new Error(error.message);
  },

  async createInvitation(data: {
    organizationId: string;
    role?: string;
    email?: string;
    walletAddress?: string;
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
        wallet_address: data.walletAddress ? data.walletAddress.toLowerCase() : null,
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
    // First, find the invitation by code (case-insensitive)
    const { data: invitation, error: findError } = await supabase
      .from("invitations")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (findError || !invitation) throw new Error("Invitation not found");

    // Update invitation status
    const { error: updateError } = await supabase
      .from("invitations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", invitation.id);

    if (updateError) throw new Error(updateError.message);

    // Add user to organization with the role from the invitation
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        organization_id: invitation.organization_id,
        user_id: userId.toLowerCase(),
        role: invitation.role || "staff",
      } as any);

    if (roleError) throw new Error(roleError.message);
  },

  async joinWithOrgCode(code: string, userId: string, walletAddress: string): Promise<void> {
    const org = await this.findOrgByInviteCode(code);
    if (!org) throw new Error("Invalid invite code");

    // Store wallet address in lowercase for consistency
    const lowerUserId = userId.toLowerCase();

    const { error } = await supabase
      .from("user_roles")
      .insert({
        organization_id: org.id,
        user_id: lowerUserId,
        role: "pending",
      } as UserRoleInsert);

    if (error) throw new Error(error.message);

    // Notify admin about new join request
    await this.notifyJoinRequest(org.id, lowerUserId);
  },

  async getPendingJoinRequests(orgId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("organization_id", orgId)
      .eq("role", "pending");

    if (error) throw new Error(error.message);
    return data || [];
  },

  async approveJoinRequest(userId: string, orgId: string, role: "employee" | "manager" | "auditor" = "employee"): Promise<void> {
    console.log("approveJoinRequest called:", { userId, orgId, role });
    
    // First get the current pending record
    const { data: pendingRecord, error: fetchError } = await supabase
      .from("user_roles")
      .select("id, organization_id, user_id, role")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .eq("role", "pending")
      .single();

    console.log("Pending record found:", { pendingRecord, fetchError });

    if (fetchError || !pendingRecord) {
      console.error("Pending request not found:", fetchError);
      throw new Error("Pending request not found");
    }

    console.log("Updating record with ID:", pendingRecord.id);
    
    // Update the role to employee - using ID directly
    const { error: updateError } = await supabase
      .from("user_roles")
      .update({ role: role as any, created_at: new Date().toISOString() })
      .eq("id", pendingRecord.id);

    console.log("Update result:", { updateError });

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(updateError.message);
    }
    
    console.log("Approval successful!");
  },

  async rejectJoinRequest(userId: string, orgId: string): Promise<void> {
    console.log("rejectJoinRequest called:", { userId, orgId });
    
    // First get the current pending record
    const { data: pendingRecord, error: fetchError } = await supabase
      .from("user_roles")
      .select("id, organization_id, user_id, role")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .eq("role", "pending")
      .single();

    console.log("Pending record found:", { pendingRecord, fetchError });

    if (fetchError || !pendingRecord) {
      console.error("Pending request not found:", fetchError);
      throw new Error("Pending request not found");
    }

    console.log("Deleting record with ID:", pendingRecord.id);
    
    // Delete the pending request - using ID directly
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", pendingRecord.id);

    console.log("Delete result:", { deleteError });

    if (deleteError) {
      console.error("Delete error:", deleteError);
      throw new Error(deleteError.message);
    }
    
    console.log("Rejection successful!");
  },

  async isUserPending(userId: string, orgId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .eq("role", "pending")
      .single();

    if (error && error.code !== "PGRST116") return false;
    return !!data;
  },

  // Notifications
  async createNotification(data: {
    organizationId: string;
    userId?: string;
    type: "announcement" | "payment" | "document" | "alert" | "join_request" | "join_approved" | "join_rejected" | "invitation_sent" | "vote_started" | "vote_ended" | "new_vote";
    title: string;
    message: string;
  }): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .insert({
        organization_id: data.organizationId,
        user_id: data.userId || null,
        type: data.type,
        title: data.title,
        message: data.message,
        read: false,
      });

    if (error) throw new Error(error.message);
  },

  // Notify owner when someone requests to join via invite code
  async notifyJoinRequest(orgId: string, requesterId: string): Promise<void> {
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", orgId)
      .single();

    const { data: owner } = await supabase
      .from("organizations")
      .select("owner_id")
      .eq("id", orgId)
      .single();

    if (owner) {
      await this.createNotification({
        organizationId: orgId,
        userId: owner.owner_id,
        type: "join_request",
        title: "New Join Request",
        message: `User ${requesterId.slice(0, 8)}...${requesterId.slice(-4)} wants to join ${org?.name || "your organization"}`,
      });
    }
  },

  // Notify user when their join request is approved
  async notifyJoinApproved(orgId: string, userId: string): Promise<void> {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();

    await this.createNotification({
      organizationId: orgId,
      userId,
      type: "join_approved",
      title: "Join Request Approved",
      message: `Your request to join ${org?.name || "the organization"} has been approved!`,
    });
  },

  // Notify user when their join request is rejected
  async notifyJoinRejected(orgId: string, userId: string): Promise<void> {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();

    await this.createNotification({
      organizationId: orgId,
      userId,
      type: "join_rejected",
      title: "Join Request Declined",
      message: `Your request to join ${org?.name || "the organization"} has been declined.`,
    });
  },

  // Notify user when they're invited via email
  async notifyInvitationSent(orgId: string, inviteeEmail: string): Promise<void> {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();

    // For email invitations, we store the email in the notification
    // The user will see this when they log in with that email
    await this.createNotification({
      organizationId: orgId,
      userId: inviteeEmail, // Using email as userId for email invites
      type: "invitation_sent",
      title: "You've Been Invited",
      message: `You've been invited to join ${org?.name || "an organization"} on PriviPay.`,
    });
  },

  // Notify all org members about a new vote
  async notifyVoteStarted(orgId: string, voteTitle: string): Promise<void> {
    await this.createNotification({
      organizationId: orgId,
      type: "vote_started",
      title: "New Vote Started",
      message: `A new vote has started: ${voteTitle}`,
    });
  },

  // Notify all org members about vote results
  async notifyVoteEnded(orgId: string, voteTitle: string): Promise<void> {
    await this.createNotification({
      organizationId: orgId,
      type: "vote_ended",
      title: "Vote Completed",
      message: `The vote for "${voteTitle}" has ended.`,
    });
  },

  // Notify when someone votes
  async notifyNewVote(orgId: string, voterCount: number): Promise<void> {
    await this.createNotification({
      organizationId: orgId,
      type: "new_vote",
      title: "New Vote Cast",
      message: `${voterCount} member${voterCount > 1 ? "s have" : " has"} voted in the current poll.`,
    });
  },
};

export default organizationService;