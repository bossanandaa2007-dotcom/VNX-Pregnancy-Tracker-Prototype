import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Hospital,
  Phone,
  Mail,
  MapPin,
  Clock,
  Stethoscope,
} from 'lucide-react';

export default function HospitalInfo() {
  const hospitalPhone = '+91 98765 11122';
  const hospitalMapLink =
    'https://www.google.com/maps/search/?api=1&query=VNX+Medical+Center';

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Hospital Information</h1>
          <p className="text-muted-foreground">
            Details about your registered medical center
          </p>
        </div>

        {/* Hospital Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hospital className="h-5 w-5 text-primary" />
              VNX Medical Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <p className="text-sm">
                12, Health Avenue, Anna Nagar,
                <br />
                Chennai – 600040, Tamil Nadu
              </p>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <p className="text-sm">{hospitalPhone}</p>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <p className="text-sm">support@vnxhealth.com</p>
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Visiting Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Monday – Friday: 9:00 AM – 7:00 PM</p>
            <p>Saturday: 9:00 AM – 2:00 PM</p>
            <p>Sunday: Emergency Only</p>
          </CardContent>
        </Card>

        {/* Departments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li>• Obstetrics</li>
              <li>• Gynecology</li>
              <li>• Neonatology</li>
              <li>• Pediatrics</li>
              <li>• Ultrasound & Imaging</li>
              <li>• Emergency Care</li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => {
              window.location.href = `tel:${hospitalPhone}`;
            }}
          >
            Call Hospital
          </Button>

          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open(hospitalMapLink, '_blank')}
          >
            Open in Maps
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
