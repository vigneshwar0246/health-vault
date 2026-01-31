import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useFamily } from '@/contexts/FamilyContext';
import type { MedicalReport } from '@/types/health';
import { Plus, FileText, Download, Eye, Trash2, Upload, Calendar, Tag } from 'lucide-react';
import { formatDate, storage } from '@/lib/storage';
import { reportsAPI, API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';

export default function Reports() {
  const { activeMember } = useFamily();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    type: 'lab' as MedicalReport['type'],
    date: '',
    notes: '',
    tags: '',
  });

  // Load data from storage
  const loadReports = () => {
    const data = storage.getData();
    const memberReports = activeMember
      ? data.reports.filter(r => r.memberId === activeMember.id)
      : [];
    setReports(memberReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    loadReports();
  }, [activeMember]);

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'lab',
      date: '',
      notes: '',
      tags: '',
    });
    setSelectedFile(null);
  };

  const copyOriginal = (report: MedicalReport) => {
    if (!report.originalText) return toast.error('No original text to copy');
    navigator.clipboard?.writeText(report.originalText);
    toast.success('Original extracted text copied to clipboard');
  };

  const handleAddReport = () => {
    if (!activeMember || !formData.title || !formData.date) return;

    const newReport: MedicalReport = {
      id: crypto.randomUUID(),
      memberId: activeMember.id,
      title: formData.title,
      type: formData.type,
      date: formData.date,
      fileUrl: '',
      fileType: 'pdf',
      notes: formData.notes,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      createdAt: new Date().toISOString(),
    };

    const data = storage.getData();
    data.reports.push(newReport);
    storage.setData(data);

    storage.logActivity({
      action: 'create',
      entityType: 'report',
      entityId: newReport.id,
      description: `Added medical report: ${newReport.title}`,
    });

    setIsAddDialogOpen(false);
    resetForm();
    loadReports();
    toast.success('Report added successfully');
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile || !activeMember) return;
    setIsUploading(true);
    try {
      await reportsAPI.uploadReportFile(activeMember.id, selectedFile, {
        title: formData.title || selectedFile.name,
        date: formData.date || new Date().toISOString(),
        type: formData.type,
        notes: formData.notes,
      });

      // Refresh reports from backend
      const serverReportsRaw = await reportsAPI.getReports(activeMember.id);
      const serverReportsArr = Array.isArray(serverReportsRaw) ? serverReportsRaw : [];

      // Strict Deduplication
      const uniqueMap = new Map<string, any>();
      for (const r of serverReportsArr) {
        const key = r.fileUrl || `${r.title}-${r.date}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, r);
        }
      }
      const uniqueServerReports = Array.from(uniqueMap.values());

      const data = storage.getData();
      // Replace only this member's reports with deduped server reports
      data.reports = data.reports.filter(r => r.memberId !== activeMember.id).concat(uniqueServerReports);
      storage.setData(data);

      storage.logActivity({
        action: 'create',
        entityType: 'report',
        entityId: 'import',
        description: `Uploaded and parsed report: ${selectedFile.name}`,
      });

      setIsAddDialogOpen(false);
      resetForm();
      loadReports();
      toast.success('Report uploaded and parsed successfully');
    } catch (err) {
      console.error('Upload failed', err);
      toast.error('Failed to upload and parse report');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteReport = (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    const data = storage.getData();
    data.reports = data.reports.filter(r => r.id !== reportId);
    storage.setData(data);

    storage.logActivity({
      action: 'delete',
      entityType: 'report',
      entityId: reportId,
      description: 'Deleted medical report',
    });

    loadReports();
    toast.success('Report deleted');
  };

  const handleViewReport = (report: MedicalReport) => {
    if (!report.fileUrl) return toast.error('No file available to view');
    const base = (window as any).__API_BASE_URL || API_BASE_URL.replace(/\/api$/, '');
    const url = report.fileUrl.startsWith('http') ? report.fileUrl : `${base}${report.fileUrl}`;
    window.open(url, '_blank');
  };

  const handleDownloadReport = async (report: MedicalReport) => {
    if (!report.fileUrl) return toast.error('No file available to download');
    try {
      const base = (window as any).__API_BASE_URL || API_BASE_URL.replace(/\/api$/, '');
      const url = report.fileUrl.startsWith('http') ? report.fileUrl : `${base}${report.fileUrl}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch file');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Download failed', err);
      toast.error('Failed to download file');
    }
  };

  const getTypeColor = (type: MedicalReport['type']) => {
    switch (type) {
      case 'lab': return 'bg-blue-100 text-blue-800';
      case 'imaging': return 'bg-green-100 text-green-800';
      case 'prescription': return 'bg-purple-100 text-purple-800';
      case 'discharge': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!activeMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold mb-2">No Family Member Selected</h1>
        <p className="text-muted-foreground">Please select a family member to view their medical reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Medical Reports</h1>
          <p className="text-muted-foreground">
            Manage medical reports and documents for {activeMember.name}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Medical Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Report Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Blood Test Results"
                />
              </div>

              <div>
                <Label htmlFor="type">Report Type</Label>
                <Select value={formData.type} onValueChange={(value: MedicalReport['type']) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lab">Lab Results</SelectItem>
                    <SelectItem value="imaging">Imaging</SelectItem>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="discharge">Discharge Summary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Report Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this report"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="file">Upload PDF / Image</Label>
                <input
                  id="file"
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., annual checkup, cardiology"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddReport} disabled={!formData.title || !formData.date || isUploading}>
                  Add Manually
                </Button>
                <Button onClick={handleUploadAndParse} disabled={isUploading || !selectedFile || !formData.date || !activeMember}>
                  {isUploading ? 'Uploading...' : 'Upload & Parse'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Medical Reports</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload medical reports and documents to keep track of {activeMember.name}'s health records.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Add First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{report.title}</h3>
                      <Badge className={getTypeColor(report.type)}>
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </Badge>
                      {report.parsedData?.alertLevel && (
                        <Badge className={
                          report.parsedData.alertLevel === 'red' ? 'bg-red-100 text-red-800' :
                            report.parsedData.alertLevel === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                        }>
                          {report.parsedData.alertLevel.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(report.date)}
                      </span>
                      {report.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {report.tags.length} tags
                        </span>
                      )}
                    </div>

                    {report.notes && (
                      <p className="text-sm text-muted-foreground mb-3 italic">"{report.notes}"</p>
                    )}

                    {report.parsedData && Object.keys(report.parsedData).length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-md mb-3 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Extracted Insights</span>
                          {report.originalText && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => copyOriginal(report)}>
                              Copy Text
                            </Button>
                          )}
                        </div>
                        <ul className="text-sm space-y-1">
                          {Object.entries(report.parsedData)
                            .filter(([k]) => !['summary', 'alertLevel'].includes(k))
                            .slice(0, 5)
                            .map(([k, v], i) => (
                              <li key={i} className="flex gap-2">
                                <span className="font-medium text-slate-700">{k}:</span>
                                <span className="text-slate-600">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {report.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {report.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-slate-100">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 self-start md:self-center">
                    {report.fileUrl && (
                      <>
                        <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => handleViewReport(report)}>
                          <Eye className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">View</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => handleDownloadReport(report)}>
                          <Download className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Download</span>
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteReport(report.id)}
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