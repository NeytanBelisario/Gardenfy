import { GardenSummary } from './types';

export const mockGardens: GardenSummary[] = [
  {
    id: 'garden-internal-001',
    name: 'Internal Garden',
    plantCount: 12,
    vitality: 84,
    environment: 'indoor',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBcHzgEnTeu-0IYDsmLVDynJ6oVguFIDupOKIE-RqJ1Ey5MroTbwpQWQ61xxx3pMukcOXc0Nr36iBSKBZ5YHMhqrYEsSSb9gv6LBbDdWCfhRlDkuuPlpC-NZZ8xSOHz79etr3mItBUsge5yQw7A3ovu-ifxle-YoKaZ4kB3gJ7fmae0OLUknat63qTPQErK5963frnlHSNu36wlLfCsYj4RFIlQmq_2QvweSX48HkTVkDkDZxKWGOADVrTs4QOa9QXeKwU1LKRpseo',
    alert: {
      label: '3 need water',
      tone: 'danger',
    },
    metrics: [
      {
        kind: 'light',
        label: 'Light',
        value: 62,
      },
      {
        kind: 'water',
        label: 'Water',
        value: 48,
      },
    ],
  },
];
