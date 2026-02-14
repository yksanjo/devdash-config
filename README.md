# DevDash Config

A configuration parser and validator for dashboard configurations in YAML/JSON format.

## Installation

```bash
npm install @devdash/config
```

## Usage

```typescript
import { parseConfig, validateConfig, exportAsJSON, exportAsYAML } from '@devdash/config';

const config = parseConfig(yamlString);
const errors = validateConfig(config);

// Export in different formats
const json = exportAsJSON(config);
const yaml = exportAsYAML(config);
```

## Features

- Parse YAML and JSON configurations
- Validate dashboard configurations
- Schema validation with detailed errors
- Export to JSON/YAML formats
- Type-safe configuration types

## Configuration Schema

```yaml
dashboard:
  title: "My Dashboard"
  layout: grid
  components:
    - type: line-chart
      dataSource: api
      config:
        title: "Sales"
        dataKey: revenue
```

## License

MIT
