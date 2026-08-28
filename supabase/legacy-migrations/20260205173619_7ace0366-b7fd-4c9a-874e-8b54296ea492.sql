-- Allow admins to view all memberships (for admin dashboard)
CREATE POLICY "Admins can view all memberships"
ON public.user_memberships
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles (for admin dashboard)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));