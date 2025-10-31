export interface Recipe {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  area: string;
  instructions: string;
  ingredients: string[];
  tags: string[];
}

export interface DropdownOptionsResponse {
  categories: string[];
  areas: string[];
  ingredients: string[];
}

export interface RecipeSearchRequest {
  query: string;
}

export interface RecipeSearchResponse {
  query: string;
  results: Recipe[];
  parseTree: any;
  executionTime: string;
  resultCount: number;
  generatedSQL: string;
}

export interface QueryValidationResponse {
  query: string;
  isValid: boolean;
  errorMessage?: string;
  parseTree?: any;
}

export interface RecipeState {
  cuisines: {
    include: string[];
    exclude: string[];
    mode: 'include' | 'exclude';
    operator: 'OR' | 'AND';
  };
  ingredients: {
    include: string[];
    exclude: string[];
    mode: 'include' | 'exclude';
    includeOperator: 'AND' | 'OR';
  };
  diets: string[];
  dietOperator: 'AND' | 'OR';
  quick: boolean;
  easy: boolean;
}