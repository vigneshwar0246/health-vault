import React, { useState, useEffect } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FamilyMember, VitalReading, MedicalReport, DoctorNote, Medication, Symptom } from '@/types/health';
import { storage } from '@/lib/storage';
import { API_BASE_URL } from '@/lib/api';

interface ExportOptions {
  includeVitals: boolean;
  includeReports: boolean;
  includeReportFiles?: boolean; // Embed original report PDFs when exporting
  includeNotes: boolean;
  includeMedications: boolean;
  includeSymptoms: boolean;
  includeEmergencyContacts: boolean;
  includeAllergies: boolean;
  includeChronicConditions: boolean;
}

const Export: React.FC = () => {
  const { familyMembers } = useFamily();
  const [vitals, setVitals] = useState<VitalReading[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeVitals: true,
    includeReports: true,
    includeReportFiles: false,
    includeNotes: true,
    includeMedications: true,
    includeSymptoms: true,
    includeEmergencyContacts: true,
    includeAllergies: true,
    includeChronicConditions: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Load data from storage
  useEffect(() => {
    const data = storage.getData();
    setVitals(data.vitals || []);
    setReports(data.reports || []);
    setDoctorNotes(data.doctorNotes || []);
    setMedications(data.medications || []);
    setSymptoms(data.symptoms || []);
  }, []);

  const handleExportOptionChange = (option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  /* New PDF Generation Logic matching the "Evergreen" style */
  const generatePDF = async () => {
    setIsExporting(true);
    try {
      // If user wants to include original report PDFs, call backend to merge them server-side.
      if (exportOptions.includeReports && exportOptions.includeReportFiles) {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE_URL}/export/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ memberId: selectedMemberId === 'all' ? null : selectedMemberId, options: exportOptions })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Export generation failed');

        // Download generated file
        const base = (window as any).__API_BASE_URL || API_BASE_URL.replace(/\/api$/, '');
        const url = data.fileUrl.startsWith('http') ? data.fileUrl : `${base}${data.fileUrl}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = url.split('/').pop() || 'health-export.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();

        toast.success('Export completed successfully!');
        return;
      }

      // Initialize PDF (Client-side Fallback)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = 20;

      // Colors
      const THEME_COLOR: [number, number, number] = [10, 110, 85]; // Dark Teal/Green like the image
      const TEXT_COLOR: [number, number, number] = [60, 60, 60];
      const BLACK: [number, number, number] = [0, 0, 0];

      // Helper functions
      const addHeader = (isFirstPage = false) => {
        if (!isFirstPage) return; // Only header on first page for this template style, or repeat if needed

        // Health Vault Header - Centered
        yPos = 30;
        pdf.setTextColor(...THEME_COLOR);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(24);
        pdf.text('HealthVault', pageWidth / 2, yPos, { align: 'center' });
        // Address/Subtitle
        yPos += 6;
        pdf.setFontSize(10);
        pdf.setTextColor(...TEXT_COLOR);
        pdf.text('Personal Health Record System • Generated Report', pageWidth / 2, yPos, { align: 'center' });

        // Title: MEDICAL REPORT
        yPos += 15;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.setTextColor(...BLACK);
        pdf.text('MEDICAL REPORT', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;
      };

      const addFooter = () => {
        const totalPages = (pdf.internal as any).getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);

          const footerY = pageHeight - 15;
          pdf.text('For inquiries, please consult your healthcare provider.', pageWidth / 2, footerY, { align: 'center' });
          pdf.text(`HealthVault App • Page ${i} of ${totalPages}`, pageWidth / 2, footerY + 5, { align: 'center' });
        }
      };

      const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - 20) {
          pdf.addPage();
          yPos = 30; // Reset Y padding for new page
        }
      };

      const addSectionTitle = (title: string) => {
        checkPageBreak(15);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(...THEME_COLOR);
        pdf.text(title, margin, yPos);
        yPos += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...TEXT_COLOR);
        pdf.setFontSize(10);
      };

      // --- Start Generation ---

      const membersToExport = selectedMemberId === 'all'
        ? familyMembers
        : familyMembers.filter(member => member.id === selectedMemberId);

      for (let i = 0; i < membersToExport.length; i++) {
        const member = membersToExport[i];

        if (i > 0) {
          pdf.addPage();
          yPos = 20;
        }

        addHeader(true);

        // -- Visit Info (Report Info) --
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(...THEME_COLOR);
        pdf.text('Report Info', margin, yPos);
        yPos += 8;

        // Two columns for Report Info
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(...BLACK);
        pdf.text("Generated By:", margin, yPos);
        pdf.text("Report Date:", margin + 80, yPos);

        pdf.setFont('helvetica', 'normal');
        pdf.text("HealthVault App", margin + 35, yPos);
        pdf.text(new Date().toLocaleDateString(), margin + 110, yPos);
        yPos += 6;

        pdf.setFont('helvetica', 'bold');
        pdf.text("Type:", margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text("Comprehensive Medical Summary", margin + 35, yPos);
        yPos += 15;


        // -- Patient Info --
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(...THEME_COLOR);
        pdf.text('Patient Info', margin, yPos);
        yPos += 8;

        // Grid for Patient Info
        const leftColX = margin;
        const rightColX = margin + 80;
        const colWidth = 35;

        // Row 1
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(...BLACK);
        pdf.text('Full Name:', leftColX, yPos);
        pdf.text('Birth Date:', rightColX, yPos);

        pdf.setFont('helvetica', 'normal');
        pdf.text(member.name, leftColX + colWidth, yPos);
        pdf.text(new Date(member.dateOfBirth).toLocaleDateString(), rightColX + colWidth, yPos);
        yPos += 6;

        // Row 2
        pdf.setFont('helvetica', 'bold');
        pdf.text('Gender:', leftColX, yPos);
        pdf.text('Blood Grp:', rightColX, yPos);

        pdf.setFont('helvetica', 'normal');
        pdf.text(member.gender, leftColX + colWidth, yPos);
        pdf.text(member.bloodGroup || 'N/A', rightColX + colWidth, yPos);
        yPos += 6;

        // Row 3
        pdf.setFont('helvetica', 'bold');
        pdf.text('Age:', leftColX, yPos);

        // Calculate age
        const age = new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear();
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${age} years`, leftColX + colWidth, yPos);
        yPos += 15;


        // -- Sections Based on Data --

        // 1. Vital Signs (Assessment-like structure)
        if (exportOptions.includeVitals) {
          addSectionTitle('Latest Vital Signs');
          const memberVitals = vitals.filter(v => v.memberId === member.id);

          if (memberVitals.length > 0) {
            // Get latest of each type
            const latestVitals = Object.values(
              memberVitals.reduce((acc, curr) => {
                if (!acc[curr.type] || new Date(curr.recordedAt) > new Date(acc[curr.type].recordedAt)) {
                  acc[curr.type] = curr;
                }
                return acc;
              }, {} as Record<string, VitalReading>)
            );

            let vitalText = "";
            latestVitals.forEach(v => {
              const val = v.secondaryValue ? `${v.value}/${v.secondaryValue}` : `${v.value}`;
              vitalText += `• ${v.type.replace('_', ' ').toUpperCase()}: ${val} ${v.unit} (${v.status})\n`;
            });

            const splitVitals = pdf.splitTextToSize(vitalText, pageWidth - (margin * 2));
            checkPageBreak(splitVitals.length * 5);
            pdf.text(splitVitals, margin, yPos);
            yPos += (splitVitals.length * 5) + 5;
          } else {
            pdf.text('No vital sign records found.', margin, yPos);
            yPos += 10;
          }
        }

        // 2. Doctor Notes (Diagnosis-like)
        if (exportOptions.includeNotes) {
          addSectionTitle('Doctor Notes & Diagnosis');
          const memberNotes = doctorNotes.filter(n => n.memberId === member.id);

          if (memberNotes.length > 0) {
            memberNotes.forEach(note => {
              checkPageBreak(20);
              pdf.setFont('helvetica', 'bold');
              pdf.text(`${note.date} - ${note.doctorName}`, margin, yPos);
              yPos += 5;
              pdf.setFont('helvetica', 'normal');
              const splitNote = pdf.splitTextToSize(note.content, pageWidth - (margin * 2));
              checkPageBreak(splitNote.length * 5);
              pdf.text(splitNote, margin, yPos);
              yPos += (splitNote.length * 5) + 5;
            });
          } else {
            pdf.text('No doctor notes or diagnosis records found.', margin, yPos);
            yPos += 10;
          }
        }

        // 3. Medications (Prescription-like)
        if (exportOptions.includeMedications) {
          addSectionTitle('Active Medications');
          const memberMeds = medications.filter(m => m.memberId === member.id && m.isActive);

          if (memberMeds.length > 0) {
            let medsText = "The patient is currently prescribed the following medications:\n\n";
            memberMeds.forEach(m => {
              medsText += `• ${m.name} (${m.dosage}) - ${m.frequency}\n`;
            });

            const splitMeds = pdf.splitTextToSize(medsText, pageWidth - (margin * 2));
            checkPageBreak(splitMeds.length * 5);
            pdf.text(splitMeds, margin, yPos);
            yPos += (splitMeds.length * 5) + 5;
          } else {
            const noMedsText = "No active medication prescriptions found at this time.";
            pdf.text(noMedsText, margin, yPos);
            yPos += 10;
          }
        }

        // 4. Reports Summary
        if (exportOptions.includeReports) {
          addSectionTitle('Medical Reports History');
          const memberReports = reports.filter(r => r.memberId === member.id);

          if (memberReports.length > 0) {
            memberReports.slice(0, 10).forEach(r => {
              checkPageBreak(6);
              pdf.text(`• ${r.date}: ${r.title} (${r.type})`, margin, yPos);
              yPos += 6;
            });
          } else {
            pdf.text("No medical reports on file.", margin, yPos);
            yPos += 10;
          }
        }

        // 5. Allergies & Conditions
        if (exportOptions.includeAllergies || exportOptions.includeChronicConditions) {
          addSectionTitle('Medical Alerts');

          if (exportOptions.includeAllergies && member.allergies.length > 0) {
            pdf.setFont('helvetica', 'bold');
            pdf.text("Allergies:", margin, yPos);
            pdf.setFont('helvetica', 'normal');
            const allergyText = member.allergies.join(", ");
            const splitAllergy = pdf.splitTextToSize(allergyText, pageWidth - (margin * 2) - 30);
            pdf.text(splitAllergy, margin + 25, yPos);
            yPos += (splitAllergy.length * 5) + 5;
          }

          if (exportOptions.includeChronicConditions && member.chronicConditions.length > 0) {
            pdf.setFont('helvetica', 'bold');
            pdf.text("Conditions:", margin, yPos);
            pdf.setFont('helvetica', 'normal');
            const conditionText = member.chronicConditions.join(", ");
            const splitCond = pdf.splitTextToSize(conditionText, pageWidth - (margin * 2) - 30);
            pdf.text(splitCond, margin + 25, yPos);
            yPos += (splitCond.length * 5) + 5;
          }
        }
      }

      // Add footer to all pages
      addFooter();

      // Save the PDF
      const titleName = membersToExport.length === 1 ? membersToExport[0].name.replace(/\s+/g, '-') : 'Family';
      const fileName = `HealthVault-Report-${titleName}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success('Medical report generated successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Export Medical Data</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
          <CardDescription>
            Select which family member and data types to include in the PDF export.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Member Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Family Member</label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a family member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Family Members</SelectItem>
                {familyMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data to Include</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vitals"
                  checked={exportOptions.includeVitals}
                  onCheckedChange={() => handleExportOptionChange('includeVitals')}
                />
                <label htmlFor="vitals" className="text-sm font-medium">
                  Vital Signs
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reports"
                  checked={exportOptions.includeReports}
                  onCheckedChange={() => handleExportOptionChange('includeReports')}
                />
                <label htmlFor="reports" className="text-sm font-medium">
                  Medical Reports
                </label>
              </div>

              {/* Enabled option for server-side PDF merging */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reportFiles"
                  checked={exportOptions.includeReportFiles}
                  onCheckedChange={() => handleExportOptionChange('includeReportFiles' as any)}
                />
                <label htmlFor="reportFiles" className="text-sm font-medium">
                  Include original report PDFs (Server Only)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notes"
                  checked={exportOptions.includeNotes}
                  onCheckedChange={() => handleExportOptionChange('includeNotes')}
                />
                <label htmlFor="notes" className="text-sm font-medium">
                  Doctor Notes
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="medications"
                  checked={exportOptions.includeMedications}
                  onCheckedChange={() => handleExportOptionChange('includeMedications')}
                />
                <label htmlFor="medications" className="text-sm font-medium">
                  Medications
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="symptoms"
                  checked={exportOptions.includeSymptoms}
                  onCheckedChange={() => handleExportOptionChange('includeSymptoms')}
                />
                <label htmlFor="symptoms" className="text-sm font-medium">
                  Symptoms
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emergency"
                  checked={exportOptions.includeEmergencyContacts}
                  onCheckedChange={() => handleExportOptionChange('includeEmergencyContacts')}
                />
                <label htmlFor="emergency" className="text-sm font-medium">
                  Emergency Contacts
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allergies"
                  checked={exportOptions.includeAllergies}
                  onCheckedChange={() => handleExportOptionChange('includeAllergies')}
                />
                <label htmlFor="allergies" className="text-sm font-medium">
                  Allergies
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="conditions"
                  checked={exportOptions.includeChronicConditions}
                  onCheckedChange={() => handleExportOptionChange('includeChronicConditions')}
                />
                <label htmlFor="conditions" className="text-sm font-medium">
                  Chronic Conditions
                </label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Summary */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Export Summary</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {selectedMemberId === 'all' ? familyMembers.length : 1} Member(s)
              </Badge>
              {exportOptions.includeVitals && (
                <Badge variant="outline">
                  Vitals Included
                </Badge>
              )}
              {exportOptions.includeMedications && (
                <Badge variant="outline">
                  Medications Included
                </Badge>
              )}
            </div>
          </div>

          {/* Export Button */}
          <Button
            onClick={generatePDF}
            disabled={isExporting || familyMembers.length === 0}
            className="w-full"
            size="lg"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Medical Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Export;