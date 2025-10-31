import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecipeService } from './services/recipe.service';
import {
  RecipeState,
  Recipe,
  DropdownOptionsResponse,
  RecipeSearchResponse
} from './models/recipe.models';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Recipe Finder - Boolean Query Builder');

  // State management
  state: RecipeState = {
    cuisines: {
      include: [],
      exclude: [],
      mode: 'include',
      operator: 'OR'
    },
    ingredients: {
      include: [],
      exclude: [],
      mode: 'include',
      includeOperator: 'AND'
    },
    diets: [],
    dietOperator: 'AND',
    quick: false,
    easy: false
  };

  // Dropdown options
  dropdownOptions: DropdownOptionsResponse = {
    categories: [],
    areas: [],
    ingredients: []
  };

  // Search results
  searchResults: Recipe[] = [];
  searchQuery = '';
  isSearching = false;
  parseTreeVisible = false;
  parseTree: any = null;
  resultCount = 0;
  executionTime = '';
  showInfoDialog = false;
  generatedSQL = '';
  sqlVisible = false;
  currentView: 'search' | 'results' | 'recipe-detail' = 'search';
  activeTab: 'recipes' | 'parse' | 'sql' = 'recipes';
  selectedRecipe: Recipe | null = null;

  constructor(private recipeService: RecipeService) {}

  ngOnInit() {
    this.loadDropdownOptions();
  }

  // Load dropdown options from hardcoded TheMealDB values
  loadDropdownOptions() {
    // Using actual TheMealDB values for better performance
    this.dropdownOptions = {
      categories: ['Beef', 'Breakfast', 'Chicken', 'Dessert', 'Goat', 'Lamb', 'Miscellaneous', 'Pasta', 'Pork', 'Seafood', 'Side', 'Starter', 'Vegan', 'Vegetarian'],
      areas: ['American', 'British', 'Canadian', 'Chinese', 'Croatian', 'Dutch', 'Egyptian', 'Filipino', 'French', 'Greek', 'Indian', 'Irish', 'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian', 'Mexican', 'Moroccan', 'Polish', 'Portuguese', 'Russian', 'Spanish', 'Thai', 'Tunisian', 'Turkish', 'Ukrainian', 'Vietnamese'],
      ingredients: ['Chicken', 'Salmon', 'Beef', 'Pork', 'Avocado', 'Lime', 'Rice', 'Onions', 'Garlic', 'Tomatoes', 'Potatoes', 'Carrots', 'Mushrooms', 'Peppers', 'Cheese', 'Butter', 'Olive Oil', 'Salt', 'Black Pepper', 'Paprika']
    };
  }

  // Cuisine methods
  setCuisineMode(mode: 'include' | 'exclude') {
    this.state.cuisines.mode = mode;
  }

  addCuisine(cuisineSelect: HTMLSelectElement) {
    const value = cuisineSelect.value;
    if (!value) return;

    const list = this.state.cuisines.mode === 'include'
      ? this.state.cuisines.include
      : this.state.cuisines.exclude;
    const otherList = this.state.cuisines.mode === 'include'
      ? this.state.cuisines.exclude
      : this.state.cuisines.include;

    // Remove from other list if present
    const otherIndex = otherList.indexOf(value);
    if (otherIndex > -1) {
      otherList.splice(otherIndex, 1);
    }

    if (!list.includes(value)) {
      list.push(value);
      this.updateQuery();
    }
    cuisineSelect.value = '';
  }

  removeCuisine(value: string, mode: 'include' | 'exclude') {
    const list = mode === 'include'
      ? this.state.cuisines.include
      : this.state.cuisines.exclude;
    const index = list.indexOf(value);
    if (index > -1) {
      list.splice(index, 1);
      this.updateQuery();
    }
  }

  setCuisineOperator(operator: 'OR' | 'AND') {
    this.state.cuisines.operator = operator;
    this.updateQuery();
  }

  // Ingredient methods
  setIngredientMode(mode: 'include' | 'exclude') {
    this.state.ingredients.mode = mode;
  }

  addIngredient(ingredientSelect: HTMLSelectElement) {
    const value = ingredientSelect.value;
    if (!value) return;

    const list = this.state.ingredients.mode === 'include'
      ? this.state.ingredients.include
      : this.state.ingredients.exclude;
    const otherList = this.state.ingredients.mode === 'include'
      ? this.state.ingredients.exclude
      : this.state.ingredients.include;

    // Remove from other list if present
    const otherIndex = otherList.indexOf(value);
    if (otherIndex > -1) {
      otherList.splice(otherIndex, 1);
    }

    if (!list.includes(value)) {
      list.push(value);
      this.updateQuery();
    }
    ingredientSelect.value = '';
  }

  removeIngredient(value: string, mode: 'include' | 'exclude') {
    const list = mode === 'include'
      ? this.state.ingredients.include
      : this.state.ingredients.exclude;
    const index = list.indexOf(value);
    if (index > -1) {
      list.splice(index, 1);
      this.updateQuery();
    }
  }

  setIngredientIncludeOperator(operator: 'AND' | 'OR') {
    this.state.ingredients.includeOperator = operator;
    this.updateQuery();
  }

  // Diet methods
  addDiet(dietSelect: HTMLSelectElement) {
    const value = dietSelect.value;
    if (value && !this.state.diets.includes(value)) {
      this.state.diets.push(value);
      this.updateQuery();
    }
    dietSelect.value = '';
  }

  removeDiet(value: string) {
    this.state.diets = this.state.diets.filter(d => d !== value);
    this.updateQuery();
  }

  setDietOperator(operator: 'AND' | 'OR') {
    this.state.dietOperator = operator;
    this.updateQuery();
  }

  // Update options
  onQuickChange() {
    this.updateQuery();
  }

  onEasyChange() {
    this.updateQuery();
  }

  // Build query string
  buildQueryString(): string {
    const parts: string[] = [];

    // Add included cuisines
    if (this.state.cuisines.include.length > 0) {
      if (this.state.cuisines.include.length === 1) {
        parts.push(this.state.cuisines.include[0]);
      } else {
        parts.push('(' + this.state.cuisines.include.join(` ${this.state.cuisines.operator} `) + ')');
      }
    }

    // Add included ingredients
    if (this.state.ingredients.include.length > 0) {
      if (this.state.ingredients.include.length === 1) {
        parts.push(this.state.ingredients.include[0]);
      } else {
        parts.push('(' + this.state.ingredients.include.join(` ${this.state.ingredients.includeOperator} `) + ')');
      }
    }

    // Add diets
    if (this.state.diets.length > 0) {
      if (this.state.diets.length === 1) {
        parts.push(this.state.diets[0]);
      } else {
        parts.push('(' + this.state.diets.join(` ${this.state.dietOperator} `) + ')');
      }
    }

    // Add quick/easy
    if (this.state.quick) parts.push('quick');
    if (this.state.easy) parts.push('easy');

    // Add excluded cuisines
    if (this.state.cuisines.exclude.length > 0) {
      if (this.state.cuisines.exclude.length === 1) {
        parts.push('NOT ' + this.state.cuisines.exclude[0]);
      } else {
        parts.push('NOT (' + this.state.cuisines.exclude.join(' OR ') + ')');
      }
    }

    // Add excluded ingredients
    if (this.state.ingredients.exclude.length > 0) {
      if (this.state.ingredients.exclude.length === 1) {
        parts.push('NOT ' + this.state.ingredients.exclude[0]);
      } else {
        parts.push('NOT (' + this.state.ingredients.exclude.join(' OR ') + ')');
      }
    }

    return parts.join(' AND ');
  }

  // Update query display
  updateQuery() {
    this.searchQuery = this.buildQueryString();
    this.updateParseTree();
    this.generateSQL();
  }

  // Update parse tree display
  updateParseTree() {
    if (this.searchQuery.trim()) {
      this.parseTree = this.generateLocalParseTree(this.searchQuery);
    } else {
      this.parseTree = null;
    }
  }

  // Generate parse tree locally without API call
  generateLocalParseTree(query: string) {
    if (!query.trim()) return null;

    const operators: string[] = [];
    const terms: string[] = [];

    // First, extract all operators including NOT, (, and )
    const operatorPattern = /\b(AND|OR|NOT)\b|\(|\)/g;
    let match;
    while ((match = operatorPattern.exec(query)) !== null) {
      operators.push(match[0]);
    }

    // Extract terms by removing all operators and splitting on whitespace
    let termsText = query;

    // Remove operators while preserving word boundaries
    termsText = termsText.replace(/\b(AND|OR|NOT)\b/g, ' ');
    termsText = termsText.replace(/[()]/g, ' ');

    // Split on whitespace and filter out empty strings
    const extractedTerms = termsText
      .split(/\s+/)
      .map(term => term.trim())
      .filter(term => term.length > 0);

    terms.push(...extractedTerms);

    return {
      type: 'BooleanQuery',
      query: query,
      structure: this.formatParseTreeDisplay(query),
      terms: terms,
      operators: operators,
      hasParentheses: query.includes('(') || query.includes(')'),
      hasNot: query.includes('NOT')
    };
  }

  // Format parse tree for better display
  formatParseTreeDisplay(query: string): string {
    let tree = 'Query Structure:\n\n';

    if (!query.trim()) {
      return tree + '(empty query)';
    }

    // Simple formatting for demo
    const lines = query
      .replace(/\s+AND\s+/g, '\n├── AND\n│   ')
      .replace(/\s+OR\s+/g, '\n├── OR\n│   ')
      .replace(/NOT\s+/g, '├── NOT\n│   ');

    tree += '└── ' + lines;

    return tree;
  }

  // Toggle parse tree
  toggleParseTree() {
    this.parseTreeVisible = !this.parseTreeVisible;
  }

  // Toggle SQL display
  toggleSQL() {
    this.sqlVisible = !this.sqlVisible;
  }

  // Generate SQL from Boolean query
  generateSQL() {
    if (!this.searchQuery.trim()) {
      this.generatedSQL = '';
      return;
    }

    // Convert Boolean query to SQL WHERE clause
    let sql = 'SELECT r.*, c.CategoryName, a.AreaName\nFROM Recipes r\n';
    sql += 'LEFT JOIN Categories c ON r.CategoryId = c.Id\n';
    sql += 'LEFT JOIN Areas a ON r.AreaId = a.Id\n';
    sql += 'LEFT JOIN RecipeIngredients ri ON r.Id = ri.RecipeId\n';
    sql += 'LEFT JOIN Ingredients i ON ri.IngredientId = i.Id\n';
    sql += 'WHERE ';

    // Transform Boolean logic to SQL
    const whereClause = this.convertBooleanToSQL(this.searchQuery);
    sql += whereClause;
    sql += '\nGROUP BY r.Id\nORDER BY r.Name;';

    this.generatedSQL = sql;
  }

  // Convert Boolean query to SQL WHERE clause
  convertBooleanToSQL(query: string): string {
    if (!query.trim()) return '1=1';

    // Replace Boolean operators with SQL equivalents
    let sqlWhere = query;

    // Handle cuisines/areas
    sqlWhere = sqlWhere.replace(/\b(american|british|canadian|chinese|croatian|dutch|egyptian|filipino|french|greek|indian|irish|italian|jamaican|japanese|kenyan|malaysian|mexican|moroccan|polish|portuguese|russian|spanish|thai|tunisian|turkish|ukrainian|vietnamese)\b/gi,
      "a.AreaName = '$1'");

    // Handle ingredients
    sqlWhere = sqlWhere.replace(/\b(chicken|salmon|beef|pork|avocado|lime|rice|onions|garlic|tomatoes|potatoes|carrots|mushrooms|peppers|cheese|butter)\b/gi,
      "i.IngredientName LIKE '%$1%'");

    // Handle categories
    sqlWhere = sqlWhere.replace(/\b(breakfast|dessert|goat|lamb|miscellaneous|pasta|seafood|side|starter|vegan|vegetarian)\b/gi,
      "c.CategoryName = '$1'");

    // Handle dietary restrictions and attributes
    sqlWhere = sqlWhere.replace(/\bvegetarian\b/gi, "r.IsVegetarian = 1");
    sqlWhere = sqlWhere.replace(/\bvegan\b/gi, "r.IsVegan = 1");
    sqlWhere = sqlWhere.replace(/\bgluten_free\b/gi, "r.IsGlutenFree = 1");
    sqlWhere = sqlWhere.replace(/\bquick\b/gi, "r.CookTimeMinutes <= 30");
    sqlWhere = sqlWhere.replace(/\beasy\b/gi, "r.DifficultyLevel = 'Easy'");

    // Handle NOT operator
    sqlWhere = sqlWhere.replace(/NOT\s+\(/gi, 'NOT (');
    sqlWhere = sqlWhere.replace(/NOT\s+([^(]\S+)/gi, 'NOT $1');

    return sqlWhere;
  }

  // Search functionality
  performSearch() {
    if (!this.searchQuery.trim()) return;

    this.isSearching = true;
    this.searchResults = [];

    this.recipeService.searchRecipes({ query: this.searchQuery }).subscribe({
      next: (response: RecipeSearchResponse) => {
        this.searchResults = response.results;
        this.parseTree = response.parseTree;
        this.resultCount = response.resultCount;
        this.executionTime = response.executionTime;
        this.generatedSQL = response.generatedSQL || '';
        this.isSearching = false;
        this.currentView = 'results'; // Switch to results view
      },
      error: (error) => {
        console.error('Search failed:', error);
        this.isSearching = false;
        // Handle error - could show error message to user
      }
    });
  }

  // Back to search functionality
  backToSearch() {
    this.currentView = 'search';
    this.activeTab = 'recipes'; // Reset to recipes tab when going back
    this.selectedRecipe = null;
  }

  // Back to results functionality
  backToResults() {
    this.currentView = 'results';
    this.selectedRecipe = null;
  }

  // Show recipe details
  showRecipeDetails(recipe: Recipe) {
    this.selectedRecipe = recipe;
    this.currentView = 'recipe-detail';
  }

  // Tab management
  setActiveTab(tab: 'recipes' | 'parse' | 'sql') {
    this.activeTab = tab;
  }

  // Helper methods
  hasQuery(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  formatDiet(diet: string): string {
    return diet.replace('_', ' ');
  }

  // Preset query samples
  presetQueries = [
    {
      name: 'Date Night',
      description: 'Elegant romantic dinner',
      query: '(italian OR french) AND (elegant OR romantic) AND NOT quick',
      icon: '💕'
    },
    {
      name: 'Weeknight',
      description: 'Quick family dinner',
      query: '(quick OR easy) AND (chicken OR pasta) AND NOT (nuts OR shellfish)',
      icon: '⚡'
    },
    {
      name: 'Healthy',
      description: 'Nutritious and mindful',
      query: '(vegetarian OR vegan) AND (low_carb OR keto) AND (quick OR meal_prep)',
      icon: '🥗'
    }
  ];

  // Apply a preset query
  applyPresetQuery(preset: any) {
    // Clear current state
    this.clearAllSelections();

    // Set the query directly
    this.searchQuery = preset.query;
    this.updateParseTree();

    // Optional: Auto-search
    // this.performSearch();
  }

  // Clear all current selections
  clearAllSelections() {
    this.state.cuisines.include = [];
    this.state.cuisines.exclude = [];
    this.state.ingredients.include = [];
    this.state.ingredients.exclude = [];
    this.state.diets = [];
    this.state.quick = false;
    this.state.easy = false;
  }

  // Clear query and reset
  clearQuery() {
    this.clearAllSelections();
    this.searchQuery = '';
    this.parseTree = null;
    this.searchResults = [];
    this.resultCount = 0;
  }

  // Info dialog methods
  toggleInfoDialog() {
    this.showInfoDialog = !this.showInfoDialog;
  }

  closeInfoDialog() {
    this.showInfoDialog = false;
  }
}
