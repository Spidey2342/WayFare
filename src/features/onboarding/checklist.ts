export type ChecklistItemId = 'profile' | 'firstCard' | 'friends' | 'lesson';

export interface ChecklistState {
  profileDone: boolean;
  firstCardDone: boolean;
  friendsDone: boolean;
  lessonDone: boolean;
  dismissed: boolean;
}

export function defaultChecklistState(): ChecklistState {
  return {
    profileDone: false,
    firstCardDone: false,
    friendsDone: false,
    lessonDone: false,
    dismissed: false,
  };
}

export function checklistItems(state: ChecklistState) {
  return [
    { id: 'profile' as const, label: 'Set up profile', done: state.profileDone },
    { id: 'firstCard' as const, label: 'Play your first card', done: state.firstCardDone },
    { id: 'friends' as const, label: 'Try a game with friends', done: state.friendsDone },
    { id: 'lesson' as const, label: 'Finish a lesson', done: state.lessonDone },
  ];
}

export function checklistProgress(state: ChecklistState): {
  done: number;
  total: number;
  complete: boolean;
  visible: boolean;
} {
  const items = checklistItems(state);
  const done = items.filter((item) => item.done).length;
  const total = items.length;
  const complete = done === total;
  const visible = !state.dismissed && !complete;
  return { done, total, complete, visible };
}

export function routeForChecklistItem(id: ChecklistItemId): string {
  switch (id) {
    case 'profile':
      return '/auth/profile-setup';
    case 'firstCard':
      return '/onboarding/practice';
    case 'friends':
      return '/groups';
    case 'lesson':
      return '/learn';
    default:
      return '/home';
  }
}
