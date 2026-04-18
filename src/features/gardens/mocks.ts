import { GardenDetails, GardenSummary } from './types';

export const mockGardenDetails: GardenDetails[] = [
  {
    id: 'garden-internal-001',
    name: 'Urban Eden',
    label: 'Internal Garden',
    plantCount: 12,
    vitality: 84,
    averageHydration: 48,
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
    plants: [
      {
        id: 'plant-monstera-001',
        name: 'Monstera',
        subtitle: 'Swiss Cheese Plant',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBdfJfl0KDnTi-OTOlh3tIFByrCw04GYLHMxPwDEA-2jg-cdFt1tg5dqMF8fZjAty4BFI5iKM4XHCJSjnufsTg9BcmHW-q8Hd862Ub94o4Ykyjt8RCWHsEkLjddITrfTuDHyYOVFT2ik5pIJgeQZTOY5MTyu047-b1FqsAReTzeXqh09pEBZatyEKcMkFgqk4b7hF_wBQMZJ26sPbuN3VOVeN5d2fHLObNtRGWoJj4kBW109Prp0gU_VAk4vaJLtWRFySTaLafxtI0',
        status: {
          label: 'Vital',
          tone: 'vital',
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
      {
        id: 'plant-sansevieria-001',
        name: 'Sansevieria',
        subtitle: 'Snake Plant',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBN7N-fFh9GPS7zdVAm6VbgCOr_4afXA_NmSd57BUW5ZyF5qhRxgl5b1ULlrRIrL_r7CzmMbUkL_GC3dkRBsfktgnJohrAsiyy6C4uAeB0htsPZPA7rCF3bWMEnTKp8LPaztp0o7kxY3wP1zXF-AmYhYu5Ypix1PCgPjXtWmlWjEbKwxoanShcgyEXLjg80DzeUyPbkDCpyBWAmcu_J8r5_uZwn0KO9madUdG7MQAZDsI0w6wHhZG5nUYIlzYfMFkmR95O1-uef2LU',
        status: {
          label: 'Stable',
          tone: 'stable',
        },
        metrics: [
          {
            kind: 'light',
            label: 'Light',
            value: 25,
          },
          {
            kind: 'water',
            label: 'Water',
            value: 72,
          },
        ],
      },
      {
        id: 'plant-echeveria-001',
        name: 'Echeveria',
        subtitle: 'Succulent',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCsfig-HXO4f40uBasJLqr1tI1KWLK9RJr-5aQPU0-9Q0UZHACbSsK3b5J6EoqvtNMvwDZuve8wmUonznuTTGWKTcDP76CjV5aJBfY8XICiuCefuhBH1cL_ZmRTjVgemdJikVcmEj6IHKvunqhjL1GYAUlxCXxfjjDW4GSNXSYCxuQXnF0c-zcxCow1ap6GaK9CxAqEAHMgHuoV4YJ7cLERAMZ_L0pPL0sQJQ-PG41mgdiZqbSkSQOPecuxZymvzg0xP85qxuAn2P0',
        status: {
          label: 'Dry',
          tone: 'dry',
        },
        metrics: [
          {
            kind: 'light',
            label: 'Light',
            value: 88,
          },
          {
            kind: 'water',
            label: 'Water',
            value: 12,
          },
        ],
      },
    ],
  },
];

export const mockGardens: GardenSummary[] = mockGardenDetails.map(
  ({ averageHydration: _averageHydration, plants: _plants, ...garden }) => garden
);

export function getMockGardenById(id: string) {
  return mockGardenDetails.find((garden) => garden.id === id);
}
