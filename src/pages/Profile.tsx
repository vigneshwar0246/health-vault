import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import type { FamilyMember, EmergencyContact } from '@/types/health';
import { Plus, Edit, Trash2, Phone, User, Calendar, Droplet, Users, Heart, AlertTriangle, Camera, AlertCircle, X, Upload } from 'lucide-react';
import { formatDate, storage } from '@/lib/storage';
import { toast } from 'sonner';

export default function Profile() {
  const { user } = useAuth();
  const { familyMembers, activeMember, addMember, updateMember, deleteMember, setActiveMember } = useFamily();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkAddText, setBulkAddText] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    bloodGroup: '',
    allergies: '',
    chronicConditions: '',
    emergencyContacts: [] as EmergencyContact[],
  });

  const validateForm = (data: typeof formData): string[] => {
    const errors: string[] = [];

    if (!data.name.trim()) {
      errors.push('Name is required');
    }

    if (!data.dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const birthDate = new Date(data.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        errors.push('Date of birth cannot be in the future');
      }
    }

    // Validate emergency contacts
    data.emergencyContacts.forEach((contact, index) => {
      if (contact.name && (!contact.relationship || !contact.phone)) {
        errors.push(`Emergency contact ${index + 1}: All fields are required if name is provided`);
      }
    });

    return errors;
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Get family statistics
  const getFamilyStats = () => {
    const totalMembers = familyMembers.length;
    const totalAllergies = familyMembers.reduce((sum, member) => sum + member.allergies.length, 0);
    const totalConditions = familyMembers.reduce((sum, member) => sum + member.chronicConditions.length, 0);
    const totalEmergencyContacts = familyMembers.reduce((sum, member) => sum + member.emergencyContacts.length, 0);

    return {
      totalMembers,
      totalAllergies,
      totalConditions,
      totalEmergencyContacts,
      avgAge: totalMembers > 0 ? Math.round(familyMembers.reduce((sum, member) => sum + calculateAge(member.dateOfBirth), 0) / totalMembers) : 0
    };
  };

  const stats = getFamilyStats();

  const resetForm = () => {
    setFormData({
      name: '',
      dateOfBirth: '',
      gender: 'male',
      bloodGroup: '',
      allergies: '',
      chronicConditions: '',
      emergencyContacts: [],
    });
  };

  const handleAddMember = () => {
    const errors = validateForm(formData);
    setValidationErrors(errors);

    if (errors.length > 0) return;

    const memberData = {
      ...formData,
      allergies: formData.allergies.split(',').map(a => a.trim()).filter(a => a),
      chronicConditions: formData.chronicConditions.split(',').map(c => c.trim()).filter(c => c),
    };

    addMember(memberData);
    setIsAddDialogOpen(false);
    resetForm();
    setValidationErrors([]);
    toast.success('Family member added successfully!');
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      bloodGroup: member.bloodGroup,
      allergies: member.allergies.join(', '),
      chronicConditions: member.chronicConditions.join(', '),
      emergencyContacts: member.emergencyContacts,
    });
    setIsAddDialogOpen(true);
    setValidationErrors([]);
  };

  const handleUpdateMember = () => {
    if (!editingMember) return;

    const errors = validateForm(formData);
    setValidationErrors(errors);

    if (errors.length > 0) return;

    const updates = {
      ...formData,
      allergies: formData.allergies.split(',').map(a => a.trim()).filter(a => a),
      chronicConditions: formData.chronicConditions.split(',').map(c => c.trim()).filter(c => c),
    };

    updateMember(editingMember.id, updates);
    setEditingMember(null);
    setIsAddDialogOpen(false);
    resetForm();
    setValidationErrors([]);
    toast.success('Family member updated successfully!');
  };

  const handleDeleteMember = (memberId: string) => {
    if (confirm('Are you sure you want to delete this family member? This action cannot be undone.')) {
      deleteMember(memberId);
      toast.success('Family member deleted successfully!');
    }
  };

  const addEmergencyContact = () => {
    const newContact: EmergencyContact = {
      id: crypto.randomUUID(),
      name: '',
      relationship: '',
      phone: '',
    };
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, newContact],
    }));
  };

  const removeEmergencyContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index),
    }));
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      ),
    }));
  };

  const handleAvatarUpload = async (memberId: string, file: File) => {
    try {
      const base64 = await fileToBase64(file);
      updateMember(memberId, { avatarUrl: base64 });
      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleBulkAdd = () => {
    const lines = bulkAddText.trim().split('\n').filter(line => line.trim());
    let successCount = 0;
    let errorCount = 0;

    lines.forEach(line => {
      try {
        // Expected format: Name,YYYY-MM-DD,Gender,BloodGroup
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          const [name, dateOfBirth, gender, bloodGroup = ''] = parts;
          const memberData = {
            name,
            dateOfBirth,
            gender: gender.toLowerCase() as 'male' | 'female' | 'other',
            bloodGroup,
            allergies: [],
            chronicConditions: [],
            emergencyContacts: [],
          };

          // Basic validation for bulk add
          if (name && dateOfBirth && ['male', 'female', 'other'].includes(gender.toLowerCase())) {
            addMember(memberData);
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    });

    setIsBulkAddOpen(false);
    setBulkAddText('');
    toast.success(`Added ${successCount} family members successfully${errorCount > 0 ? ` (${errorCount} failed)` : ''}!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Family Profiles</h1>
          <p className="text-muted-foreground">
            Manage health profiles for you and your family members
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Add Family Members</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk-text">Enter member details (one per line)</Label>
                  <Textarea
                    id="bulk-text"
                    placeholder="John Doe,1990-01-15,male,O+&#10;Jane Smith,1985-03-22,female,A-"
                    value={bulkAddText}
                    onChange={(e) => setBulkAddText(e.target.value)}
                    rows={6}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Format: Name,DateOfBirth,Gender,BloodGroup (optional)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkAdd} disabled={!bulkAddText.trim()}>
                  Add Members
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingMember(null); setValidationErrors([]); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Family Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMember ? 'Edit Family Member' : 'Add Family Member'}</DialogTitle>
              </DialogHeader>

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Validation Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value: 'male' | 'female' | 'other') => setFormData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blood-group">Blood Group</Label>
                  <Select value={formData.bloodGroup} onValueChange={(value) => setFormData(prev => ({ ...prev, bloodGroup: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                  <Input
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                    placeholder="e.g., Peanuts, Penicillin, Dust"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="conditions">Chronic Conditions (comma-separated)</Label>
                  <Input
                    id="conditions"
                    value={formData.chronicConditions}
                    onChange={(e) => setFormData(prev => ({ ...prev, chronicConditions: e.target.value }))}
                    placeholder="e.g., Diabetes, Hypertension, Asthma"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Emergency Contacts</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEmergencyContact}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>

                {formData.emergencyContacts.map((contact, index) => (
                  <div key={contact.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm">Name</Label>
                      <Input
                        value={contact.name}
                        onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                        placeholder="Contact name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Relationship</Label>
                      <Input
                        value={contact.relationship}
                        onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                        placeholder="e.g., Spouse, Parent"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Phone</Label>
                      <Input
                        value={contact.phone}
                        onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmergencyContact(index)}
                        className="w-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingMember ? handleUpdateMember : handleAddMember}>
                  {editingMember ? 'Update Member' : 'Add Member'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Family Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalConditions}</p>
                <p className="text-sm text-muted-foreground">Conditions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalAllergies}</p>
                <p className="text-sm text-muted-foreground">Allergies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalEmergencyContacts}</p>
                <p className="text-sm text-muted-foreground">Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.avgAge}</p>
                <p className="text-sm text-muted-foreground">Avg Age</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Family Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {familyMembers.map((member) => (
          <Card key={member.id} className={`relative ${member.isDefault ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {calculateAge(member.dateOfBirth)} years old • {member.gender}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditMember(member)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMember(member.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(member.dateOfBirth).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-muted-foreground" />
                  <span>{member.bloodGroup || 'Not specified'}</span>
                </div>
              </div>

              {member.allergies.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Allergies</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.allergies.map((allergy, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {member.chronicConditions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Chronic Conditions</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.chronicConditions.map((condition, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {member.emergencyContacts.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Emergency Contacts</Label>
                  <div className="space-y-1 mt-1">
                    {member.emergencyContacts.map((contact, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{contact.name} ({contact.relationship})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveMember(member.id)}
                  className={activeMember?.id === member.id ? 'bg-primary text-primary-foreground' : ''}
                >
                  {activeMember?.id === member.id ? 'Active' : 'Set Active'}
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleAvatarUpload(member.id, e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id={`avatar-${member.id}`}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor={`avatar-${member.id}`} className="cursor-pointer">
                      <Camera className="h-4 w-4 mr-2" />
                      Avatar
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {familyMembers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Family Members</h3>
            <p className="text-muted-foreground mb-4">
              Add your first family member to start tracking their health data.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Family Member
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}