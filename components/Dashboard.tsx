import MedicationForm from '@/components/MedicationForm';
import ReminderTimeline from '@/components/ReminderTimeline';
import NotificationLog from '@/components/NotificationLog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Dashboard() {
  return (
    <main className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>İlaç Hatırlatma – Yeni Kayıt</CardTitle>
        </CardHeader>
        <CardContent>
          <MedicationForm />
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Planlanan Hatırlatmalar</CardTitle>
        </CardHeader>
        <CardContent>
          <ReminderTimeline />
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Gönderilen SMS Kayıtları</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationLog />
        </CardContent>
      </Card>
    </main>
  );
}
