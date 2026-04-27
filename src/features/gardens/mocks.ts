import { GardenDetails, PlantCatalogItem } from './types';
import { initializeGardensStore } from './store';

export const mockGardenDetailsSeed: GardenDetails[] = [];

export const mockPlantCatalog: PlantCatalogItem[] = [
  {
    id: 'catalog-monstera-001',
    name: 'Monstera Deliciosa',
    subtitle: 'Costela de Adao',
    category: 'foliage',
    categoryLabel: 'Folhagem',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAW5RM8NQiyde1JOvFVLUhl5EOpwlZz1vGUsIcviqLknYVqO2qqvyCVdCwdoLQ11SxstqZ31uB9kw5S2FbiyI2i_n6Jtr6s_WDSxg0mB10bdQXTTCIgl92sbhJRfkd1ZWC2BT2KRo9vkABZJ4-NIDuuSK6HAKtaStyGYX0T2Dv9pvRPwBUWn1DPVr6X_ZfbsBepIyFuUKbjv7H8C5iWHxebTl6UaVHpVhdNbWn4WuarCeGNb7bbua7JfsINvnZYG_cB_gTlB865EBA',
    featured: true,
  },
  {
    id: 'catalog-pilea-001',
    name: 'Pilea Peperomioides',
    subtitle: 'Planta Chinesa do Dinheiro',
    category: 'foliage',
    categoryLabel: 'Folhagem',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCDEyczU6MQuyQbJFF4rA6FMAQbBglO3Lo_2omF1-_D0aCnTKbsBiOpfnsFk7kSZQBnAaZ6hDmT-xB314yD4j3i6SCOOHwOR0g5vv85zxQANLWXj9JLc50NFOI3PpCWE898HhAAeSH1IjL3UMgE0bmTFTcsBi68BQ5JndC1g3OwTt8qvDf5KJXI_k6YH_-LKZDNJhYoLw8gkzNwmLYpPA1hRoUJkqv7NbeUQ4tdq2TTbqOHapuZ9igsF-2R4C1IBg5PtTxfdiUaIVY',
  },
  {
    id: 'catalog-calathea-001',
    name: 'Calathea Orbifolia',
    subtitle: 'Calathea de Folha Redonda',
    category: 'foliage',
    categoryLabel: 'Folhagem',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBXD9pLjsChcc69abCDeOAZt9zjEXNh9k5nzgOr1ZZmDtapfGyTMlbDO4sgvWr7NPhBuTS3yBRNmiPmgBsPzV6vFfM00aMmWymt0sAhVpw1ynpZ3yVB5bm_STC7uPtMm5GhBJGJxVLOSLcySSwc--saVlfXeQ2bHyepjRF0RFq9qS0wVyL_LboIXyuateECz1jW1SIVQ_-R8wWm9Bf2Vy9UauqKO2M7ClqqU8mzNj8zlG8PavkvU_LDLqVqLlGuqRVfkGAJZ0tCgbU',
  },
  {
    id: 'catalog-sansevieria-001',
    name: 'Sansevieria Trifasciata',
    subtitle: 'Espada de Sao Jorge',
    category: 'resilient',
    categoryLabel: 'Resistente',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCKp5cjbikdkG9zbXjv7l0XVlMrbfv31Pb31OrW0SmTE6nOSuFevNWBlGpWdkM-jzA5bUmvZ18sk28Q_dEZrp84YYYUEEfOALcykCS24_ZJhHQ9Pyr1m2OhGC95d_J5M8xi6YoLFudHHhwR_f3QoCah7gm8T6IEVoU6lbtN4bVlQd1VvZJUBSAOTmZcwQ6QZeNKcSrZtKdRPXx3EcBOjZb0z5eB3iKYALBd3pYFeNkj3wXyPGT5fmQIE9hXnXPGsa2ZBbBTaJsvwFw',
  },
];

initializeGardensStore(mockGardenDetailsSeed);
