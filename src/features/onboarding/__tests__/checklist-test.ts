import {
  checklistProgress,
  defaultChecklistState,
  routeForChecklistItem,
} from '@/features/onboarding/checklist';

describe('start here checklist', () => {
  it('starts incomplete and visible', () => {
    const state = defaultChecklistState();
    expect(checklistProgress(state)).toEqual({
      done: 0,
      total: 4,
      complete: false,
      visible: true,
    });
  });

  it('hides when dismissed', () => {
    const state = { ...defaultChecklistState(), dismissed: true };
    expect(checklistProgress(state).visible).toBe(false);
  });

  it('completes when all items done', () => {
    const state = {
      profileDone: true,
      firstCardDone: true,
      friendsDone: true,
      lessonDone: true,
      dismissed: false,
    };
    const progress = checklistProgress(state);
    expect(progress.complete).toBe(true);
    expect(progress.visible).toBe(false);
  });

  it('routes each row to the right place', () => {
    expect(routeForChecklistItem('friends')).toBe('/groups');
    expect(routeForChecklistItem('lesson')).toBe('/learn');
  });
});
