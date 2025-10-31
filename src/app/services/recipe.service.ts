import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DropdownOptionsResponse,
  RecipeSearchRequest,
  RecipeSearchResponse,
  QueryValidationResponse,
  Recipe
} from '../models/recipe.models';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get dropdown options for the UI
   */
  getDropdownOptions(): Observable<DropdownOptionsResponse> {
    return this.http.get<DropdownOptionsResponse>(`${this.apiUrl}/dropdown-options`);
  }

  /**
   * Search recipes using Boolean query
   */
  searchRecipes(request: RecipeSearchRequest): Observable<RecipeSearchResponse> {
    return this.http.post<RecipeSearchResponse>(`${this.apiUrl}/search`, request);
  }

  /**
   * Validate a Boolean query
   */
  validateQuery(query: string): Observable<QueryValidationResponse> {
    return this.http.get<QueryValidationResponse>(`${this.apiUrl}/validate`, {
      params: { query }
    });
  }

  /**
   * Get recipe by ID
   */
  getRecipeById(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.apiUrl}/${id}`);
  }
}