// DevDash Config - Dashboard configuration parser and validator

export interface DashboardConfig {
  dashboard: {
    title: string;
    layout: 'grid' | 'flex' | 'stack';
    theme?: 'light' | 'dark';
    components: ComponentConfig[];
  };
  dataSources?: DataSourceConfig[];
}

export interface ComponentConfig {
  id?: string;
  type: 'line-chart' | 'bar-chart' | 'pie-chart' | 'table' | 'stat' | 'text';
  title?: string;
  dataSource?: string;
  config: Record<string, unknown>;
  gridColumn?: string;
  gridRow?: string;
}

export interface DataSourceConfig {
  id: string;
  type: 'rest' | 'graphql' | 'mock';
  url?: string;
  query?: string;
  transform?: string;
}

export interface ValidationError {
  path: string;
  message: string;
}

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
    errors.push({ path: '/', message: 'Config must be an object' });
    return errors;
  }
  
  const cfg = config as Record<string, unknown>;
  
  // Check dashboard
  if (!cfg.dashboard) {
    errors.push({ path: '/dashboard', message: 'Dashboard is required' });
  } else if (typeof cfg.dashboard !== 'object') {
    errors.push({ path: '/dashboard', message: 'Dashboard must be an object' });
  } else {
    const dashboard = cfg.dashboard as Record<string, unknown>;
    if (!dashboard.title) {
      errors.push({ path: '/dashboard/title', message: 'Title is required' });
    }
    if (!dashboard.components) {
      errors.push({ path: '/dashboard/components', message: 'Components are required' });
    } else if (!Array.isArray(dashboard.components)) {
      errors.push({ path: '/dashboard/components', message: 'Components must be an array' });
    }
  }
  
  return errors;
}

export function exportAsJSON(config: DashboardConfig, pretty = true): string {
  return pretty ? JSON.stringify(config, null, 2) : JSON.stringify(config);
}

export function exportAsYAML(config: DashboardConfig): string {
  const lines: string[] = [];
  
  lines.push('dashboard:');
  lines.push(`  title: "${config.dashboard.title}"`);
  lines.push(`  layout: ${config.dashboard.layout}`);
  
  if (config.dashboard.components) {
    lines.push('  components:');
    for (const comp of config.dashboard.components) {
      lines.push(`    - type: ${comp.type}`);
      if (comp.title) {
        lines.push(`      title: "${comp.title}"`);
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
