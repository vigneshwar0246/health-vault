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
import type { DoctorNote } from '@/types/health';
import { Plus, FileText, Stethoscope, Calendar, Clock, Trash2, User } from 'lucide-react';
import { formatDate, formatDateTime, storage } from '@/lib/storage';

export default function DoctorNotes() {
  const { activeMember } = useFamily();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<DoctorNote | null>(null);
  const [formData, setFormData] = useState({
    doctorName: '',
    specialty: '',
    date: '',
    content: '',
    prescriptions: '',
    followUpDate: '',
  });

  const allNotes = storage.getData().doctorNotes;
  const memberNotes = activeMember ? allNotes.filter(n => n.memberId === activeMember.id) : [];

  const resetForm = () => {
    setFormData({
      doctorName: '',
      specialty: '',
      date: '',
      content: '',
      prescriptions: '',
      followUpDate: '',
    });
  };

  const handleAddNote = () => {
    if (!activeMember || !formData.doctorName || !formData.date || !formData.content) return;

    const newNote: DoctorNote = {
      id: crypto.randomUUID(),
      memberId: activeMember.id,
      doctorName: formData.doctorName,
      specialty: formData.specialty,
      date: formData.date,
      content: formData.content,
      prescriptions: formData.prescriptions ? formData.prescriptions.split(',').map(p => p.trim()).filter(p => p) : [],
      followUpDate: formData.followUpDate || undefined,
      attachments: [], // In a real app, this would be uploaded
      createdAt: new Date().toISOString(),
    };

    const data = storage.getData();
    data.doctorNotes.push(newNote);
    storage.setData(data);

    storage.logActivity({
      action: 'create',
      entityType: 'note',
      entityId: newNote.id,
      description: `Added doctor note from ${newNote.doctorName}`,
    });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this doctor note?')) {
      const data = storage.getData();
      data.doctorNotes = data.doctorNotes.filter(n => n.id !== noteId);
      storage.setData(data);

      storage.logActivity({
        action: 'delete',
        entityType: 'note',
        entityId: noteId,
        description: 'Deleted doctor note',
      });
    }
  };

  if (!activeMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold mb-2">No Family Member Selected</h1>
        <p className="text-muted-foreground">Please select a family member to view their doctor notes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Doctor Notes</h1>
          <p className="text-muted-foreground">
            Keep track of doctor visits and medical advice for {activeMember.name}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Doctor Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Doctor Note</DialogTitle>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Visit Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="followUpDate">Follow-up Date</Label>
                  <Input
                    id="followUpDate"
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="content">Visit Notes *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Detailed notes from the doctor visit..."
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="prescriptions">Prescriptions (comma-separated)</Label>
                <Input
                  id="prescriptions"
                  value={formData.prescriptions}
                  onChange={(e) => setFormData(prev => ({ ...prev, prescriptions: e.target.value }))}
                  placeholder="e.g., Lisinopril 10mg, Metformin 500mg"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddNote} disabled={!formData.doctorName || !formData.date || !formData.content}>
                  Add Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Doctor Notes List */}
      {memberNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Doctor Notes</h3>
            <p className="text-muted-foreground text-center mb-4">
              Record notes from doctor visits to keep track of medical advice and treatment plans for {activeMember.name}.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {memberNotes
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Dr. {note.doctorName}</h3>
                        {note.specialty && (
                          <Badge variant="outline">
                            {note.specialty.charAt(0).toUpperCase() + note.specialty.slice(1)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(note.date)}
                        </span>
                        {note.followUpDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Follow-up: {formatDate(note.followUpDate)}
                          </span>
                        )}
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 mb-3">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </div>
                      {note.prescriptions && note.prescriptions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Prescriptions:</p>
                          <div className="flex flex-wrap gap-2">
                            {note.prescriptions.map((prescription, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {prescription}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
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
    </div>
  );
}