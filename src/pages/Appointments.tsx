import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useFamily } from '@/contexts/FamilyContext';
import type { Appointment } from '@/types/health';
import { Plus, Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { formatDate, formatDateTime, storage } from '@/lib/storage';

export default function Appointments() {
  const { activeMember } = useFamily();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    doctorName: '',
    specialty: '',
    location: '',
    dateTime: '',
    duration: 30,
    notes: '',
    reminderMinutes: 15,
  });

  const allAppointments = storage.getData().appointments;
  const memberAppointments = activeMember ? allAppointments.filter(a => a.memberId === activeMember.id) : [];

  const resetForm = () => {
    setFormData({
      doctorName: '',
      specialty: '',
      location: '',
      dateTime: '',
      duration: 30,
      notes: '',
      reminderMinutes: 15,
    });
  };

  const handleAddAppointment = () => {
    if (!activeMember || !formData.doctorName || !formData.dateTime) return;

    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      memberId: activeMember.id,
      doctorName: formData.doctorName,
      specialty: formData.specialty,
      location: formData.location,
      dateTime: formData.dateTime,
      duration: formData.duration,
      notes: formData.notes,
      reminderMinutes: formData.reminderMinutes,
      status: 'upcoming',
      relatedReportIds: [],
      createdAt: new Date().toISOString(),
    };

    const data = storage.getData();
    data.appointments.push(newAppointment);
    storage.setData(data);

    storage.logActivity({
      action: 'create',
      entityType: 'appointment',
      entityId: newAppointment.id,
      description: `Scheduled appointment with ${newAppointment.doctorName}`,
    });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleUpdateAppointment = () => {
    if (!editingAppointment || !formData.doctorName || !formData.dateTime) return;

    const updates = {
      doctorName: formData.doctorName,
      specialty: formData.specialty,
      location: formData.location,
      dateTime: formData.dateTime,
      duration: formData.duration,
      notes: formData.notes,
      reminderMinutes: formData.reminderMinutes,
    };

    const data = storage.getData();
    data.appointments = data.appointments.map(a =>
      a.id === editingAppointment.id ? { ...a, ...updates } : a
    );
    storage.setData(data);

    storage.logActivity({
      action: 'update',
      entityType: 'appointment',
      entityId: editingAppointment.id,
      description: `Updated appointment with ${updates.doctorName}`,
    });

    setEditingAppointment(null);
    resetForm();
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    if (confirm('Are you sure you want to delete this appointment?')) {
      const data = storage.getData();
      data.appointments = data.appointments.filter(a => a.id !== appointmentId);
      storage.setData(data);

      storage.logActivity({
        action: 'delete',
        entityType: 'appointment',
        entityId: appointmentId,
        description: 'Deleted appointment',
      });
    }
  };

  const handleStatusChange = (appointmentId: string, status: Appointment['status']) => {
    const data = storage.getData();
    data.appointments = data.appointments.map(a =>
      a.id === appointmentId ? { ...a, status } : a
    );
    storage.setData(data);

    storage.logActivity({
      action: 'update',
      entityType: 'appointment',
      entityId: appointmentId,
      description: `Marked appointment as ${status}`,
    });
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
    }
  };

  const getStatusIcon = (status: Appointment['status']) => {
    switch (status) {
      case 'upcoming': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
    }
  };

  const upcomingAppointments = memberAppointments.filter(a => a.status === 'upcoming');
  const pastAppointments = memberAppointments.filter(a => a.status !== 'upcoming');

  if (!activeMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold mb-2">No Family Member Selected</h1>
        <p className="text-muted-foreground">Please select a family member to view their appointments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">
            Schedule and manage medical appointments for {activeMember.name}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doctorName">Doctor Name *</Label>
                  <Input
                    id="doctorName"
                    value={formData.doctorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, doctorName: e.target.value }))}
                    placeholder="Dr. Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="specialty">Specialty</Label>
                  <Select value={formData.specialty} onValueChange={(value) => setFormData(prev => ({ ...prev, specialty: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Practice</SelectItem>
                      <SelectItem value="cardiology">Cardiology</SelectItem>
                      <SelectItem value="dermatology">Dermatology</SelectItem>
                      <SelectItem value="endocrinology">Endocrinology</SelectItem>
                      <SelectItem value="gastroenterology">Gastroenterology</SelectItem>
                      <SelectItem value="neurology">Neurology</SelectItem>
                      <SelectItem value="orthopedics">Orthopedics</SelectItem>
                      <SelectItem value="pediatrics">Pediatrics</SelectItem>
                      <SelectItem value="psychiatry">Psychiatry</SelectItem>
                      <SelectItem value="radiology">Radiology</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Hospital/Clinic name and address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateTime">Date & Time *</Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select value={formData.duration.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Purpose of visit, preparation instructions..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="reminder">Reminder</Label>
                <Select value={formData.reminderMinutes.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, reminderMinutes: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No reminder</SelectItem>
                    <SelectItem value="5">5 minutes before</SelectItem>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddAppointment} disabled={!formData.doctorName || !formData.dateTime}>
                  Schedule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
          <div className="grid gap-4">
            {upcomingAppointments
              .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
              .map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">Dr. {appointment.doctorName}</h3>
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1 capitalize">{appointment.status}</span>
                          </Badge>
                        </div>
                        {appointment.specialty && (
                          <p className="text-sm text-muted-foreground mb-2">{appointment.specialty}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(appointment.dateTime)} ({appointment.duration} min)
                          </span>
                          {appointment.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {appointment.location}
                            </span>
                          )}
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(appointment.id, 'completed')}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAppointment(appointment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Past Appointments</h2>
          <div className="grid gap-4">
            {pastAppointments
              .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
              .map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold text-lg">Dr. {appointment.doctorName}</h3>
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1 capitalize">{appointment.status}</span>
                          </Badge>
                        </div>
                        {appointment.specialty && (
                          <p className="text-sm text-muted-foreground mb-2">{appointment.specialty}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(appointment.dateTime)}
                          </span>
                          {appointment.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {appointment.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {memberAppointments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Appointments Scheduled</h3>
            <p className="text-muted-foreground text-center mb-4">
              Schedule upcoming medical appointments to stay organized with {activeMember.name}'s healthcare.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Appointment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}