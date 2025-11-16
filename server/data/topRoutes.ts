export interface RouteData {
  from: string;
  to: string;
  priority?: number;
  changefreq?: string;
}

export const popularRoutes: RouteData[] = [
  {
    from: 'San Francisco, CA, USA',
    to: 'Los Angeles, CA, USA',
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    from: 'Downtown Miami, Miami, FL, USA',
    to: '2100 NW 42nd Ave, Miami, FL 33142, USA',
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    from: 'New York, NY, USA',
    to: 'Boston, MA, USA',
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    from: 'Chicago, IL, USA',
    to: 'Milwaukee, WI, USA',
    priority: 0.7,
    changefreq: 'weekly'
  },
  {
    from: 'Seattle, WA, USA',
    to: 'Portland, OR, USA',
    priority: 0.7,
    changefreq: 'weekly'
  },
  {
    from: 'Austin, TX, USA',
    to: 'Houston, TX, USA',
    priority: 0.7,
    changefreq: 'weekly'
  },
  {
    from: 'Pasadena, CA, USA',
    to: 'Long Beach, CA, USA',
    priority: 0.6,
    changefreq: 'weekly'
  },
  {
    from: 'Berkeley, CA, USA',
    to: 'Sacramento, CA, USA',
    priority: 0.6,
    changefreq: 'weekly'
  },
  {
    from: 'Eugene, OR, USA',
    to: 'Vancouver, BC, Canada',
    priority: 0.6,
    changefreq: 'weekly'
  },
  {
    from: 'Spring, TX, USA',
    to: 'Houston, TX, USA',
    priority: 0.6,
    changefreq: 'weekly'
  },
  {
    from: 'Fort Lauderdale, FL, USA',
    to: 'Miami, FL, USA',
    priority: 0.6,
    changefreq: 'weekly'
  }
];
