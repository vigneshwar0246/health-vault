import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFamily } from '@/contexts/FamilyContext';
import { Activity, Eye, Plus, Edit, Trash2, Download, Share, View } from 'lucide-react';
import { formatDateTime, storage } from '@/lib/storage';

export default function ActivityLogs() {
  const { activeMember } = useFamily();
  const allLogs = storage.getData().activityLogs;

  const memberLogs = activeMember
    ? allLogs.filter(log => {
        // Filter logs related to the active member
        if (log.entityType === 'member' && log.entityId === activeMember.id) return true;
        if (log.entityType !== 'member') {
          // Check if the log is related to data owned by the active member
          const data = storage.getData();
          switch (log.entityType) {
            case 'vital':
              return data.vitals.some(v => v.id === log.entityId && v.memberId === activeMember.id);
            case 'report':
              return data.reports.some(r => r.id === log.entityId && r.memberId === activeMember.id);
            case 'note':
              return data.doctorNotes.some(n => n.id === log.entityId && n.memberId === activeMember.id);
            case 'appointment':
              return data.appointments.some(a => a.id === log.entityId && a.memberId === activeMember.id);
            case 'medication':
              return data.medications.some(m => m.id === log.entityId && m.memberId === activeMember.id);
            case 'symptom':
              return data.symptoms.some(s => s.id === log.entityId && s.memberId === activeMember.id);
            default:
              return true; // Settings and other logs
          }
        }
        return false;
      })
    : allLogs;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view': return <Eye className="h-4 w-4" />;
      case 'create': return <Plus className="h-4 w-4" />;
      case 'update': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'export': return <Download className="h-4 w-4" />;
      case 'share': return <Share className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'view': return 'bg-blue-100 text-blue-800';
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-yellow-100 text-yellow-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'export': return 'bg-purple-100 text-purple-800';
      case 'share': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType) {
      case 'vital': return 'Vital Reading';
      case 'report': return 'Medical Report';
      case 'note': return 'Doctor Note';
      case 'appointment': return 'Appointment';
      case 'medication': return 'Medication';
      case 'symptom': return 'Symptom';
      case 'member': return 'Family Member';
      case 'settings': return 'Settings';
      default: return entityType.charAt(0).toUpperCase() + entityType.slice(1);
    }
  };

  if (!activeMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold mb-2">No Family Member Selected</h1>
        <p className="text-muted-foreground">Please select a family member to view their activity logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">
            Track all activities and changes for {activeMember.name}'s health records
          </p>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{memberLogs.filter(l => l.action === 'view').length}</p>
                <p className="text-xs text-muted-foreground">Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{memberLogs.filter(l => l.action === 'create').length}</p>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{memberLogs.filter(l => l.action === 'update').length}</p>
                <p className="text-xs text-muted-foreground">Updated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{memberLogs.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs List */}
      {memberLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
            <p className="text-muted-foreground text-center">
              Activity logs will appear here as you interact with {activeMember.name}'s health data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberLogs
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 50) // Show last 50 activities
                .map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getEntityTypeLabel(log.entityType)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{log.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}