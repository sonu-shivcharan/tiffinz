import UserProfileUpdateForm from "@/components/dashboard/profile/UserProfileUpdateForm";
import { Card, CardContent } from "@/components/ui/card";

function ProfileSettingsPage() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent>
        <UserProfileUpdateForm />
      </CardContent>
    </Card>
  );
}

export default ProfileSettingsPage;
