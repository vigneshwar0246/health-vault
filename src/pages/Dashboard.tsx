import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFamily } from '@/contexts/FamilyContext';
import { useVitals } from '@/contexts/VitalsContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Activity,
  Heart,
  Thermometer,
  Droplet,
  Wind,
  Scale,
  Plus,

  Calendar,
  FileText,
} from 'lucide-react';
import { VITAL_CONFIGS, getVitalStatus, getStatusColor } from '@/lib/vitals-config';
import { storage } from '@/lib/storage';
import type { VitalReading, VitalType } from '@/types/health';

export default function Dashboard() {
  const { activeMember, familyMembers } = useFamily();
  const { vitals, addVital, isLoading: vitalsLoading, error: vitalsError } = useVitals();
  const navigate = useNavigate();
  const [isAddReadingDialogOpen, setIsAddReadingDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'blood_pressure' as VitalType,
    value: '',
    secondaryValue: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      type: 'blood_pressure',
      value: '',
      secondaryValue: '',
      notes: '',
    });
  };

  const handleAddReading = async () => {
    console.log('handleAddReading called');
    if (!activeMember || !formData.value) {
      console.log('Missing activeMember or formData.value', { activeMember, value: formData.value });
      return;
    }

    setIsSubmitting(true);
    try {
      const value = parseFloat(formData.value);
      const secondaryValue = formData.secondaryValue ? parseFloat(formData.secondaryValue) : undefined;

      const status = getVitalStatus(value, formData.type, secondaryValue);

      console.log('Calling addVital with:', {
        memberId: activeMember.id,
        type: formData.type,
        value,
        unit: VITAL_CONFIGS[formData.type].unit,
        secondaryValue,
        notes: formData.notes,
        status,
      });

      const success = await addVital({
        memberId: activeMember.id,
        type: formData.type,
        value,
        unit: VITAL_CONFIGS[formData.type].unit,
        secondaryValue,
        notes: formData.notes,
        status,
      });

      console.log('addVital result:', success);

      if (success) {
        toast.success('Vital reading added successfully!');
        setIsAddReadingDialogOpen(false);
        resetForm();
      } else {
        toast.error('Failed to add vital reading. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add vital reading:', error);
      toast.error('Failed to add vital reading. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the latest reading for each vital type
  const getLatestReading = (type: VitalType) => {
    const readings = vitals.filter(r => r.type === type);
    return readings.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
  };

  const vitalCards = [
    { type: 'blood_pressure' as VitalType, label: 'Blood Pressure', icon: Heart },
    { type: 'heart_rate' as VitalType, label: 'Heart Rate', icon: Activity },
    { type: 'temperature' as VitalType, label: 'Temperature', icon: Thermometer },
    { type: 'blood_sugar' as VitalType, label: 'Blood Sugar', icon: Droplet },
    { type: 'oxygen_saturation' as VitalType, label: 'Oxygen Level', icon: Wind },
    { type: 'weight' as VitalType, label: 'Weight', icon: Scale },
  ];

  if (familyMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold mb-2">Welcome to HealthVault!</h1>
        <p className="text-muted-foreground mb-6">Let's set up your profile to get started.</p>
        <Button onClick={() => navigate('/profile')}>
          <Plus className="h-4 w-4 mr-2" />
          Complete Your Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Health Dashboard</h1>
          <p className="text-muted-foreground">
            {activeMember ? `Viewing ${activeMember.name}'s health data` : 'Select a family member'}
          </p>
        </div>

      </div>

      {/* Vitals Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Vitals Overview</h2>
          <Dialog open={isAddReadingDialogOpen} onOpenChange={setIsAddReadingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Reading
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Vital Reading</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vital-type">Vital Type</Label>
                  <Select value={formData.type} onValueChange={(value: VitalType) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                      <SelectItem value="heart_rate">Heart Rate</SelectItem>
                      <SelectItem value="temperature">Temperature</SelectItem>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="blood_sugar">Blood Sugar</SelectItem>
                      <SelectItem value="oxygen_saturation">Oxygen Level</SelectItem>
                      <SelectItem value="bmi">BMI</SelectItem>
                      <SelectItem value="cholesterol">Cholesterol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="value">
                      {VITAL_CONFIGS[formData.type].hasSecondaryValue ? 'Systolic' : 'Value'}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.1"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={`Enter ${VITAL_CONFIGS[formData.type].label.toLowerCase()}`}
                    />
                  </div>
                  {VITAL_CONFIGS[formData.type].hasSecondaryValue && (
                    <div>
                      <Label htmlFor="secondary-value">Diastolic</Label>
                      <Input
                        id="secondary-value"
                        type="number"
                        step="0.1"
                        value={formData.secondaryValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondaryValue: e.target.value }))}
                        placeholder="Diastolic value"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setIsAddReadingDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddReading} disabled={!formData.value || isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Reading'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {vitalCards.map((vital) => {
            const latestReading = getLatestReading(vital.type);
            const config = VITAL_CONFIGS[vital.type];

            let displayValue = '--';
            let status = 'normal';

            if (latestReading) {
              if (config.hasSecondaryValue && latestReading.secondaryValue !== undefined) {
                displayValue = `${latestReading.value}/${latestReading.secondaryValue}`;
              } else {
                displayValue = latestReading.value.toString();
              }
              status = latestReading.status;
            }

            return (
              <Card key={vital.type} className={`health-card-${status} cursor-pointer hover:shadow-md transition-shadow`}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <vital.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">{vital.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{displayValue}</div>
                  <div className="text-xs text-muted-foreground">{config.unit}</div>
                  {latestReading && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(latestReading.recordedAt).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/appointments')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {activeMember ?
                `${storage.getData().appointments.filter(a => a.memberId === activeMember.id && a.status === 'upcoming').length} upcoming` :
                'Select a family member'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/reports')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {activeMember ?
                `${storage.getData().reports.filter(r => r.memberId === activeMember.id).length} reports` :
                'Select a family member'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/reminders')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {activeMember ?
                `${storage.getData().medications.filter(m => m.memberId === activeMember.id && m.isActive).length} active` :
                'Select a family member'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
