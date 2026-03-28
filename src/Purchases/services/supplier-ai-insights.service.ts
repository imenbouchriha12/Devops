// src/Purchases/services/supplier-ai-insights.service.ts
//
// Analyse IA avancée des fournisseurs avec prédictions et recommandations
// Utilise Gemini pour détecter patterns, prédire risques et suggérer actions

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupplierScore } from './supplier-scoring.service';
import { parseGeminiJson } from '../utils/json-parser.util';

export interface RiskPrediction {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  risk_factors: string[];
  predicted_issues: string[];
  confidence: number;
}

export interface ActionRecommendation {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_type: 'negotiate' | 'diversify' | 'reward' | 'monitor' | 'terminate' | 'optimize';
  title: string;
  description: string;
  expected_impact: string;
  estimated_savings?: number;
}

export interface PatternInsight {
  pattern_type: 'trend' | 'anomaly' | 'seasonality' | 'correlation';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  data_points: string[];
}

export interface BenchmarkComparison {
  metric: string;
  supplier_value: number;
  industry_average: number;
  top_quartile: number;
  performance: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  gap_analysis: string;
}

export interface SupplierAIInsights {
  supplier_id: string;
  supplier_name: string;
  analysis_date: Date;
  risk_prediction: RiskPrediction;
  recommendations: ActionRecommendation[];
  patterns: PatternInsight[];
  benchmarks: BenchmarkComparison[];
  ai_summary: string;
  analysis_confidence: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

@Injectable()
export class SupplierAiInsightsService {
  private readonly logger = new Logger(SupplierAiInsightsService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY', '');
  }

  async generateInsights(
    supplierScore: SupplierScore,
    historicalData?: any,
  ): Promise<SupplierAIInsights> {
    const start = Date.now();

    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY non configurée - analyse basique uniquement');
      return this.generateBasicInsights(supplierScore);
    }

    try {
      const aiAnalysis = await this.analyzeWithAI(supplierScore, historicalData);
      
      this.logger.log(
        `Insights IA générés en ${Date.now() - start}ms pour ${supplierScore.supplier_name}`,
      );

      return aiAnalysis;
    } catch (error: any) {
      this.logger.error(`Erreur analyse IA: ${error.message}`);
      return this.generateBasicInsights(supplierScore);
    }
  }

  private async analyzeWithAI(
    score: SupplierScore,
    historicalData?: any,
  ): Promise<SupplierAIInsights> {
    const prompt = `Tu es un expert en gestion de la chaîne d'approvisionnement et analyse de performance fournisseurs.

DONNÉES FOURNISSEUR:
Nom: ${score.supplier_name}
Score global: ${score.total_score}/100 (Grade: ${score.grade})

CRITÈRES DE PERFORMANCE:
${score.criteria.map(c => `- ${c.name}: ${c.score}/100 (poids ${c.weight}%) - ${c.label}`).join('\n')}

STATISTIQUES DÉTAILLÉES:
- Bons de commande: ${score.stats.total_pos} total, ${score.stats.confirmed_pos} confirmés
- Délai confirmation moyen: ${score.stats.avg_confirmation_days} jours
- Taux de livraison: ${score.stats.delivery_rate_pct}% (${score.stats.total_items_received}/${score.stats.total_items_ordered} unités)
- Livraisons à temps: ${score.stats.on_time_rate_pct}% (${score.stats.on_time_deliveries}/${score.stats.total_deliveries})
- Taux de litiges: ${score.stats.dispute_rate_pct}% (${score.stats.disputed_invoices}/${score.stats.total_invoices} factures)
- Taux de paiement: ${score.stats.payment_rate_pct}% (${score.stats.total_paid.toFixed(3)}/${score.stats.total_invoiced.toFixed(3)} TND)
- Délai paiement moyen: ${score.stats.avg_payment_days} jours

TÂCHES D'ANALYSE:
1. PRÉDICTION DE RISQUES: Évalue le niveau de risque futur (low/medium/high/critical), identifie 3-5 facteurs de risque principaux, prédit 2-4 problèmes potentiels dans les 3-6 prochains mois, donne un score de confiance (0-100)
2. RECOMMANDATIONS D'ACTIONS (4-6 actions): Priorité (low/medium/high/urgent), Type (negotiate/diversify/reward/monitor/terminate/optimize), Titre court et description détaillée, Impact attendu et économies estimées en TND si applicable
3. PATTERNS DÉTECTÉS (3-5 patterns): Type (trend/anomaly/seasonality/correlation), Titre et description, Sévérité (info/warning/critical), Points de données clés
4. BENCHMARKS (5-7 métriques): Métrique évaluée, Valeur fournisseur vs moyenne industrie vs top quartile, Performance (excellent/good/average/below_average/poor), Analyse de l'écart
5. RÉSUMÉ IA: Résumé en 2-3 phrases en français, Ton professionnel et actionnable

RÉPONDS UNIQUEMENT EN JSON (sans markdown):
{"risk_prediction":{"risk_level":"low|medium|high|critical","risk_score":0-100,"risk_factors":["facteur1","facteur2"],"predicted_issues":["problème1","problème2"],"confidence":0-100},"recommendations":[{"priority":"low|medium|high|urgent","action_type":"negotiate|diversify|reward|monitor|terminate|optimize","title":"titre court","description":"description détaillée","expected_impact":"impact attendu","estimated_savings":null}],"patterns":[{"pattern_type":"trend|anomaly|seasonality|correlation","title":"titre","description":"description","severity":"info|warning|critical","data_points":["point1","point2"]}],"benchmarks":[{"metric":"nom métrique","supplier_value":0,"industry_average":0,"top_quartile":0,"performance":"excellent|good|average|below_average|poor","gap_analysis":"analyse"}],"ai_summary":"résumé en français","analysis_confidence":0-100}`;

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data: GeminiResponse = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      throw new Error('Réponse Gemini vide');
    }

    const analysis = parseGeminiJson(aiText);

    return {
      supplier_id: score.supplier_id,
      supplier_name: score.supplier_name,
      analysis_date: new Date(),
      risk_prediction: analysis.risk_prediction || {},
      recommendations: analysis.recommendations || [],
      patterns: analysis.patterns || [],
      benchmarks: analysis.benchmarks || [],
      ai_summary: analysis.ai_summary || 'Analyse non disponible',
      analysis_confidence: analysis.analysis_confidence || 50,
    };
  }

  private generateBasicInsights(score: SupplierScore): SupplierAIInsights {
    const riskScore = 100 - score.total_score;
    const riskLevel = riskScore >= 60 ? 'critical' : riskScore >= 40 ? 'high' : riskScore >= 20 ? 'medium' : 'low';

    return {
      supplier_id: score.supplier_id,
      supplier_name: score.supplier_name,
      analysis_date: new Date(),
      risk_prediction: {
        risk_level: riskLevel,
        risk_score: riskScore,
        risk_factors: this.identifyRiskFactors(score),
        predicted_issues: ['Analyse IA non disponible - configurez GEMINI_API_KEY'],
        confidence: 50,
      },
      recommendations: this.generateBasicRecommendations(score),
      patterns: [{
        pattern_type: 'trend',
        title: 'Analyse basique',
        description: 'Activez l\'IA pour des insights avancés',
        severity: 'info',
        data_points: [],
      }],
      benchmarks: this.generateBasicBenchmarks(score),
      ai_summary: `Score global: ${score.total_score}/100 (${score.grade}). Configurez GEMINI_API_KEY pour une analyse IA complète.`,
      analysis_confidence: 50,
    };
  }

  private identifyRiskFactors(score: SupplierScore): string[] {
    const factors: string[] = [];
    score.criteria.forEach(c => {
      if (c.score < 50) factors.push(`${c.name} faible (${c.score}/100)`);
    });
    if (score.stats.dispute_rate_pct > 5) factors.push(`Taux de litiges élevé (${score.stats.dispute_rate_pct}%)`);
    if (score.stats.on_time_rate_pct < 80) factors.push(`Retards fréquents (${score.stats.on_time_rate_pct}% à temps)`);
    return factors.length > 0 ? factors : ['Aucun facteur de risque majeur identifié'];
  }

  private generateBasicRecommendations(score: SupplierScore): ActionRecommendation[] {
    const recs: ActionRecommendation[] = [];
    if (score.total_score >= 85) {
      recs.push({
        priority: 'medium',
        action_type: 'reward',
        title: 'Récompenser la performance',
        description: 'Fournisseur excellent - envisagez un partenariat stratégique',
        expected_impact: 'Renforcement de la relation',
      });
    } else if (score.total_score < 50) {
      recs.push({
        priority: 'urgent',
        action_type: 'monitor',
        title: 'Surveillance renforcée',
        description: 'Performance faible - évaluer alternatives',
        expected_impact: 'Réduction des risques',
      });
    }
    return recs;
  }

  private generateBasicBenchmarks(score: SupplierScore): BenchmarkComparison[] {
    return [{
      metric: 'Score global',
      supplier_value: score.total_score,
      industry_average: 70,
      top_quartile: 85,
      performance: score.total_score >= 85 ? 'excellent' : score.total_score >= 70 ? 'good' : 'average',
      gap_analysis: `${score.total_score >= 70 ? 'Au-dessus' : 'En-dessous'} de la moyenne`,
    }];
  }
}
