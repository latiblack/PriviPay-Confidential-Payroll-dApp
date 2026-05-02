-- Fix RLS policy to allow any org member to create payroll records
DROP POLICY IF EXISTS "Employers can create payroll" ON public.payroll_records;

CREATE POLICY "Org members can create payroll"
  ON public.payroll_records FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- Add existing organization owners to user_roles with employer role
INSERT INTO public.user_roles (user_id, organization_id, role)
SELECT o.owner_id, o.id, 'employer'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.organization_id = o.id AND ur.user_id = o.owner_id AND ur.role = 'employer'
);