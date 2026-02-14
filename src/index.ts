// DevDash Config - Dashboard configuration parser and validator

export interface DashboardConfig {
  dashboard: {
    title: string;
    layout: 'grid' | 'flex' | 'stack';
    theme?: 'light' | 'dark';
    columns?: number;
    components: ComponentConfig[];
  };
  dataSources?: DataSourceConfig[];
  settings?: DashboardSettings;
}

export interface ComponentConfig {
  id?: string;
  type: ComponentType;
  title?: string;
  dataSource?: string;
  config: Record<string, unknown>;
  gridColumn?: string;
  gridRow?: string;
  width?: string;
  height?: string;
}

export type ComponentType = 
  | 'line-chart' 
  | 'bar-chart' 
  | 'pie-chart' 
  | 'area-chart'
  | 'radar-chart'
  | 'treemap-chart'
  | 'scatter-chart'
  | 'table' 
  | 'stat' 
  | 'text'
  | 'card'
  | 'form'
  | 'button';

export interface DataSourceConfig {
  id: string;
  name?: string;
  type: 'rest' | 'graphql' | 'mock' | 'websocket';
  url?: string;
  query?: string;
  transform?: string;
  refreshInterval?: number;
  headers?: Record<string, string>;
}

export interface DashboardSettings {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showHeader?: boolean;
  showSidebar?: boolean;
  padding?: number;
}

export interface ValidationError {
  path: string;
  message: string;
  severity?: 'error' | 'warning';
}

const COMPONENT_TYPES: ComponentType[] = [
  'line-chart', 'bar-chart', 'pie-chart', 'area-chart', 
  'radar-chart', 'treemap-chart', 'scatter-chart',
  'table', 'stat', 'text', 'card', 'form', 'button'
];

const DATA_SOURCE_TYPES = ['rest', 'graphql', 'mock', 'websocket'];
const LAYOUTS = ['grid', 'flex', 'stack'];

export function parseConfig(input: string): DashboardConfig | null {
  try {
    // Try JSON first
    return JSON.parse(input);
  } catch {
    // Try YAML (basic parsing)
    try {
      const lines = input.split('\n');
      const obj: Record<string, unknown> = {};
      let currentKey = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const match = trimmed.match(/^(\w+):\s*(.*)$/);
        if (match) {
          currentKey = match[1];
          const value = match[2].replace(/['"]/g, '');
          if (value) {
            obj[currentKey] = value;
          }
        }
      }
      
      return obj as unknown as DashboardConfig;
    } catch {
      return null;
    }
  }
}

export function validateConfig(config: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!config || typeof config !== 'object') {
    errors.push({ path: '/', message: 'Config must be an object', severity: 'error' });
    return errors;
  }
  
  const cfg = config as Record<string, unknown>;
  
  // Check dashboard
  if (!cfg.dashboard) {
    errors.push({ path: '/dashboard', message: 'Dashboard is required', severity: 'error' });
    return errors;
  } else if (typeof cfg.dashboard !== 'object') {
    errors.push({ path: '/dashboard', message: 'Dashboard must be an object', severity: 'error' });
    return errors;
  }
  
  const dashboard = cfg.dashboard as Record<string, unknown>;
  
  // Validate title
  if (!dashboard.title) {
    errors.push({ path: '/dashboard/title', message: 'Title is required', severity: 'error' });
  } else if (typeof dashboard.title !== 'string') {
    errors.push({ path: '/dashboard/title', message: 'Title must be a string', severity: 'error' });
  }
  
  // Validate layout
  if (dashboard.layout && !LAYOUTS.includes(dashboard.layout as string)) {
    errors.push({ 
      path: '/dashboard/layout', 
      message: `Layout must be one of: ${LAYOUTS.join(', ')}`, 
      severity: 'error' 
    });
  }
  
  // Validate components
  if (!dashboard.components) {
    errors.push({ path: '/dashboard/components', message: 'Components are required', severity: 'error' });
  } else if (!Array.isArray(dashboard.components)) {
    errors.push({ path: '/dashboard/components', message: 'Components must be an array', severity: 'error' });
  } else {
    dashboard.components.forEach((comp, index) => {
      const compObj = comp as Record<string, unknown>;
      
      // Validate component type
      if (!compObj.type) {
        errors.push({ 
          path: `/dashboard/components/${index}/type`, 
          message: 'Component type is required', 
          severity: 'error' 
        });
      } else if (!COMPONENT_TYPES.includes(compObj.type as ComponentType)) {
        errors.push({ 
          path: `/dashboard/components/${index}/type`, 
          message: `Invalid component type: ${compObj.type}`, 
          severity: 'error' 
        });
      }
    });
  }
  
  // Validate data sources
  if (cfg.dataSources) {
    if (!Array.isArray(cfg.dataSources)) {
      errors.push({ path: '/dataSources', message: 'DataSources must be an array', severity: 'error' });
    } else {
      (cfg.dataSources as Record<string, unknown>[]).forEach((ds, index) => {
        if (!ds.type) {
          errors.push({ 
            path: `/dataSources/${index}/type`, 
            message: 'DataSource type is required', 
            severity: 'error' 
          });
        } else if (!DATA_SOURCE_TYPES.includes(ds.type as string)) {
          errors.push({ 
            path: `/dataSources/${index}/type`, 
            message: `Invalid data source type: ${ds.type}`, 
            severity: 'error' 
          });
        }
      });
    }
  }
  
  return errors;
}

export function isValidConfig(config: unknown): boolean {
  return validateConfig(config).length === 0;
}

export function exportAsJSON(config: DashboardConfig, pretty = true): string {
  return pretty ? JSON.stringify(config, null, 2) : JSON.stringify(config);
}

export function exportAsYAML(config: DashboardConfig): string {
  const lines: string[] = [];
  
  lines.push('dashboard:');
  lines.push(`  title: "${config.dashboard.title}"`);
  lines.push(`  layout: ${config.dashboard.layout}`);
  
  if (config.dashboard.theme) {
    lines.push(`  theme: ${config.dashboard.theme}`);
  }
  
  if (config.dashboard.components) {
    lines.push('  components:');
    for (const comp of config.dashboard.components) {
      lines.push(`    - type: ${comp.type}`);
      if (comp.title) {
        lines.push(`      title: "${comp.title}"`);
      }
      if (comp.dataSource) {
        lines.push(`      dataSource: "${comp.dataSource}"`);
      }
    }
  }
  
  if (config.dataSources) {
    lines.push('dataSources:');
    for (const ds of config.dataSources) {
      lines.push(`  - id: "${ds.id}"`);
      lines.push(`    type: ${ds.type}`);
      if (ds.url) {
        lines.push(`    url: "${ds.url}"`);
      }
    }
  }
  
  return lines.join('\n');
}

export function createDefaultConfig(): DashboardConfig {
  return {
    dashboard: {
      title: 'My Dashboard',
      layout: 'grid',
      components: [
        {
          type: 'stat',
          title: 'Total Users',
          config: { value: '0' }
        }
      ]
    }
  };
}

export function createSampleConfig(): DashboardConfig {
  return {
    dashboard: {
      title: 'Sales Dashboard',
      layout: 'grid',
      theme: 'dark',
      columns: 3,
      components: [
        {
          id: 'revenue-stat',
          type: 'stat',
          title: 'Total Revenue',
          config: { value: '$125,000', change: '+12%' }
        },
        {
          id: 'users-stat',
          type: 'stat',
          title: 'Active Users',
          config: { value: '5,432', change: '+8%' }
        },
        {
          id: 'orders-stat',
          type: 'stat',
          title: 'Orders',
          config: { value: '1,234', change: '-3%' }
        },
        {
          id: 'sales-chart',
          type: 'line-chart',
          title: 'Sales Trend',
          dataSource: 'sales-api',
          config: { dataKey: 'revenue', xKey: 'month' }
        },
        {
          id: 'category-chart',
          type: 'pie-chart',
          title: 'By Category',
          dataSource: 'categories-api',
          config: { dataKey: 'value', nameKey: 'name' }
        }
      ]
    },
    dataSources: [
      {
        id: 'sales-api',
        name: 'Sales API',
        type: 'rest',
        url: 'https://api.example.com/sales',
        refreshInterval: 30000
      },
      {
        id: 'categories-api',
        name: 'Categories API',
        type: 'rest',
        url: 'https://api.example.com/categories'
      }
    ]
  };
}

export function mergeConfigs(base: DashboardConfig, override: Partial<DashboardConfig>): DashboardConfig {
  return {
    ...base,
    dashboard: {
      ...base.dashboard,
      ...override.dashboard,
      components: override.dashboard?.components || base.dashboard.components
    },
    dataSources: override.dataSources || base.dataSources,
    settings: { ...base.settings, ...override.settings }
  };
}
