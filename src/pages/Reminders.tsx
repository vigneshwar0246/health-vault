import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFamily } from '@/contexts/FamilyContext';
import type { Medication, Symptom } from '@/types/health';
import { Plus, Pill, AlertTriangle, Clock, Calendar, Trash2, Edit, CheckCircle } from 'lucide-react';
import { formatDate, storage } from '@/lib/storage';

export default function Reminders() {
  const { activeMember } = useFamily();
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false);
  const [isSymptomDialogOpen, setIsSymptomDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [medicationForm, setMedicationForm] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    times: ['08:00'],
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [symptomForm, setSymptomForm] = useState({
    name: '',
    severity: 3 as 1 | 2 | 3 | 4 | 5,
    notes: '',
  });

  const allMedications = storage.getData().medications;
  const allSymptoms = storage.getData().symptoms;
  const memberMedications = activeMember ? allMedications.filter(m => m.memberId === activeMember.id) : [];
  const memberSymptoms = activeMember ? allSymptoms.filter(s => s.memberId === activeMember.id) : [];

  const resetMedicationForm = () => {
    setMedicationForm({
      name: '',
      dosage: '',
      frequency: 'daily',
      times: ['08:00'],
      startDate: '',
      endDate: '',
      notes: '',
    });
  };

  const resetSymptomForm = () => {
    setSymptomForm({
      name: '',
      severity: 3,
      notes: '',
    });
  };

  const handleAddMedication = () => {
    if (!activeMember || !medicationForm.name || !medicationForm.dosage || !medicationForm.startDate) return;

    const newMedication: Medication = {
      id: crypto.randomUUID(),
      memberId: activeMember.id,
      name: medicationForm.name,
      dosage: medicationForm.dosage,
      frequency: medicationForm.frequency,
      times: medicationForm.times,
      startDate: medicationForm.startDate,
      endDate: medicationForm.endDate || undefined,
      notes: medicationForm.notes,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const data = storage.getData();
    data.medications.push(newMedication);
    storage.setData(data);

    storage.logActivity({
      action: 'create',
      entityType: 'medication',
      entityId: newMedication.id,
      description: `Added medication: ${newMedication.name}`,
    });

    setIsMedicationDialogOpen(false);
    resetMedicationForm();
  };

  const handleAddSymptom = () => {
    if (!activeMember || !symptomForm.name) return;

    const newSymptom: Symptom = {
      id: crypto.randomUUID(),
      memberId: activeMember.id,
      name: symptomForm.name,
      severity: symptomForm.severity,
      notes: symptomForm.notes,
      recordedAt: new Date().toISOString(),
    };

    const data = storage.getData();
    data.symptoms.push(newSymptom);
    storage.setData(data);

    storage.logActivity({
      action: 'create',
      entityType: 'symptom',
      entityId: newSymptom.id,
      description: `Recorded symptom: ${newSymptom.name}`,
    });

    setIsSymptomDialogOpen(false);
    resetSymptomForm();
  };

  const handleDeleteMedication = (medicationId: string) => {
    if (confirm('Are you sure you want to delete this medication?')) {
      const data = storage.getData();
      data.medications = data.medications.filter(m => m.id !== medicationId);
      storage.setData(data);

      storage.logActivity({
        action: 'delete',
        entityType: 'medication',
        entityId: medicationId,
        description: 'Deleted medication',
      });
    }
  };

  const handleDeleteSymptom = (symptomId: string) => {
    if (confirm('Are you sure you want to delete this symptom record?')) {
      const data = storage.getData();
      data.symptoms = data.symptoms.filter(s => s.id !== symptomId);
      storage.setData(data);

      storage.logActivity({
        action: 'delete',
        entityType: 'symptom',
        entityId: symptomId,
        description: 'Deleted symptom record',
      });
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return 'bg-green-100 text-green-800';
    if (severity <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 1: return 'Mild';
      case 2: return 'Mild-Moderate';
      case 3: return 'Moderate';
      case 4: return 'Moderate-Severe';
      case 5: return 'Severe';
      default: return 'Unknown';
    }
  };

  const addTimeSlot = () => {
    setMedicationForm(prev => ({
      ...prev,
      times: [...prev.times, '08:00'],
    }));
  };

  const updateTimeSlot = (index: number, time: string) => {
    setMedicationForm(prev => ({
      ...prev,
      times: prev.times.map((t, i) => i === index ? time : t),
    }));
  };

  const removeTimeSlot = (index: number) => {
    if (medicationForm.times.length > 1) {
      setMedicationForm(prev => ({
        ...prev,
        times: prev.times.filter((_, i) => i !== index),
      }));
    }
  };

  if (!activeMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold mb-2">No Family Member Selected</h1>
        <p className="text-muted-foreground">Please select a family member to view their medications and symptoms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Medications & Symptoms</h1>
          <p className="text-muted-foreground">
            Track medications and monitor symptoms for {activeMember.name}
          </p>
        </div>
      </div>

      <Tabs defaultValue="medications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="medications" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="symptoms" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Symptoms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Active Medications</h2>
            <Dialog open={isMedicationDialogOpen} onOpenChange={setIsMedicationDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Medication</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="med-name">Medication Name *</Label>
                      <Input
                        id="med-name"
                        value={medicationForm.name}
                        onChange={(e) => setMedicationForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Aspirin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dosage">Dosage *</Label>
                      <Input
                        id="dosage"
                        value={medicationForm.dosage}
                        onChange={(e) => setMedicationForm(prev => ({ ...prev, dosage: e.target.value }))}
                        placeholder="e.g., 100mg"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={medicationForm.frequency} onValueChange={(value) => setMedicationForm(prev => ({ ...prev, frequency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="twice-daily">Twice Daily</SelectItem>
                        <SelectItem value="three-times-daily">Three Times Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="as-needed">As Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Dosage Times</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Time
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {medicationForm.times.map((time, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            type="time"
                            value={time}
                            onChange={(e) => updateTimeSlot(index, e.target.value)}
                          />
                          {medicationForm.times.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTimeSlot(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date *</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={medicationForm.startDate}
                        onChange={(e) => setMedicationForm(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">End Date (optional)</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={medicationForm.endDate}
                        onChange={(e) => setMedicationForm(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="med-notes">Notes</Label>
                    <Textarea
                      id="med-notes"
                      value={medicationForm.notes}
                      onChange={(e) => setMedicationForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Special instructions, side effects..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setIsMedicationDialogOpen(false); resetMedicationForm(); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMedication} disabled={!medicationForm.name || !medicationForm.dosage || !medicationForm.startDate}>
                      Add Medication
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {memberMedications.filter(m => m.isActive).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Medications</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add medications to track dosages and schedules for {activeMember.name}.
                </p>
                <Button onClick={() => setIsMedicationDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Medication
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {memberMedications
                .filter(m => m.isActive)
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map((medication) => (
                  <Card key={medication.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Pill className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">{medication.name}</h3>
                            <Badge variant="outline">{medication.dosage}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {medication.frequency} • {medication.times.join(', ')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Started {formatDate(medication.startDate)}
                              {medication.endDate && ` • Ends ${formatDate(medication.endDate)}`}
                            </span>
                          </div>
                          {medication.notes && (
                            <p className="text-sm text-muted-foreground">{medication.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMedication(medication.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="symptoms" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Symptom History</h2>
            <Dialog open={isSymptomDialogOpen} onOpenChange={setIsSymptomDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Symptom
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Symptom</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="symptom-name">Symptom Name *</Label>
                    <Input
                      id="symptom-name"
                      value={symptomForm.name}
                      onChange={(e) => setSymptomForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Headache, Nausea"
                    />
                  </div>

                  <div>
                    <Label htmlFor="severity">Severity</Label>
                    <Select value={symptomForm.severity.toString()} onValueChange={(value) => setSymptomForm(prev => ({ ...prev, severity: parseInt(value) as 1 | 2 | 3 | 4 | 5 }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Mild</SelectItem>
                        <SelectItem value="2">2 - Mild-Moderate</SelectItem>
                        <SelectItem value="3">3 - Moderate</SelectItem>
                        <SelectItem value="4">4 - Moderate-Severe</SelectItem>
                        <SelectItem value="5">5 - Severe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="symptom-notes">Notes</Label>
                    <Textarea
                      id="symptom-notes"
                      value={symptomForm.notes}
                      onChange={(e) => setSymptomForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Describe the symptom, when it started, triggers..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setIsSymptomDialogOpen(false); resetSymptomForm(); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSymptom} disabled={!symptomForm.name}>
                      Record Symptom
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {memberSymptoms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Symptoms Recorded</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Track symptoms and their severity to monitor {activeMember.name}'s health over time.
                </p>
                <Button onClick={() => setIsSymptomDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record First Symptom
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {memberSymptoms
                .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
                .map((symptom) => (
                  <Card key={symptom.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">{symptom.name}</h3>
                            <Badge className={getSeverityColor(symptom.severity)}>
                              {getSeverityLabel(symptom.severity)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(symptom.recordedAt)}
                            </span>
                          </div>
                          {symptom.notes && (
                            <p className="text-sm text-muted-foreground">{symptom.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSymptom(symptom.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}