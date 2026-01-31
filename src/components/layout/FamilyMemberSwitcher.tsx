import { ChevronDown, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useFamily } from '@/contexts/FamilyContext';
import { useNavigate } from 'react-router-dom';

export function FamilyMemberSwitcher() {
  const { familyMembers, activeMember, setActiveMember } = useFamily();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-primary',
      'bg-accent',
      'bg-chart-3',
      'bg-chart-4',
      'bg-chart-5',
    ];
    return colors[index % colors.length];
  };

  if (familyMembers.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/profile')}
        className="gap-2"
      >
        <Users className="h-4 w-4" />
        Add Family Member
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback
              className={`${getAvatarColor(
                familyMembers.findIndex(m => m.id === activeMember?.id)
              )} text-white text-xs`}
            >
              {activeMember ? getInitials(activeMember.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[100px] truncate hidden sm:inline">
            {activeMember?.name || 'Select Member'}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Family Members
        </div>
        {familyMembers.map((member, index) => (
          <DropdownMenuItem
            key={member.id}
            onClick={() => setActiveMember(member.id)}
            className="gap-2"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback
                className={`${getAvatarColor(index)} text-white text-xs`}
              >
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate">{member.name}</span>
            {member.isDefault && (
              <span className="text-xs text-muted-foreground">(You)</span>
            )}
            {member.id === activeMember?.id && (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Family Member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
