/** Verbatim strings Playwright must find per DESIGN_CONTRACT.md */
export const FRAME_CONTRACTS: Record<string, string[]> = {
  D1: ['DEBATE MODE', 'USE THIS TOPIC', 'SHUFFLE TOPIC', 'Be sharp, be kind'],
  D2: ['LEADER IS CHOOSING A TOPIC...'],
  D3: ['CHOOSE SIDES', 'START DEBATE', 'Waiting for at least 1 player on each side', 'THE JUDGE'],
  D4: ['CHOOSE YOUR SIDE', 'WAITING FOR LEADER TO START', 'WAITING FOR OTHERS...'],
  D5: ['READY FOR VERDICT', 'CURRENT TOPIC'],
  D6: ['FINAL JUDGMENT', 'Who made the stronger case?', 'ANNOUNCE WINNER', '+2 PTS'],
  D7: ['DEBATE CONCLUDED', 'The leader is deciding...'],
  D8: ['RESULTS', 'ANOTHER TOPIC', 'BACK TO GROUP'],
  D9: ['YOUR RESULTS'],
  D10: [
    'YOU ARE OFFLINE',
    'Debate Setup',
    'TEAMS',
    'Incomplete',
    'Each side needs at least 1 player to start the debate.',
    'PARTICIPANTS',
    'Reconnecting',
    'Add more players',
  ],
  S1: ['WHO IS PLAYING TODAY?', 'CONTINUE', 'JUDGE'],
  S2: ['Pass the phone to', "I'M"],
  S3: ['Ready?', 'START DEBATE'],
  O1: ['SOLO MODE', 'DAILY CHALLENGE', 'START SOLO DEBATE', 'PICK YOUR STANCE'],
  O2: ['Make Your Case', "I'VE MADE MY CASE", 'YOUR 3 MAIN POINTS'],
  O3: ['The Verdict', 'POINTS EARNED', 'DAY STREAK', 'ANOTHER TOPIC'],
  A1: ['Create Account', 'EMAIL ADDRESS', 'CONTINUE'],
  A2: ['Welcome back', 'YOUR PASSWORD', 'LOG IN'],
  A3: ['Keep your XP and badges?', 'KEEP MY PROGRESS', 'START FRESH'],
};

export const FRAME_IDS = Object.keys(FRAME_CONTRACTS);
