#!/usr/bin/env python3
"""
AKIG - Script de Catégorisation et Validation de Données Legacy
Catégorise, valide et prépare les données pour l'import
Author: AKIG Dev Team
"""

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import hashlib

@dataclass
class ValidationResult:
    """Résultat de validation d'un enregistrement"""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    category: str
    data: Dict[str, Any]
    transformed_data: Optional[Dict[str, Any]] = None

class DataCategorizer:
    """Catégoriseur et validateur de données legacy"""
    
    # Règles de validation par catégorie
    VALIDATION_RULES = {
        "proprietaires": {
            "required_fields": ["nom", "contact"],
            "optional_fields": ["email", "telephone", "adresse"],
            "email_pattern": r'^[\w\.-]+@[\w\.-]+\.\w+$',
            "phone_pattern": r'^[\d\s\+\-\(\)]+$'
        },
        "immeubles": {
            "required_fields": ["nom", "adresse"],
            "optional_fields": ["proprietaire_id", "ville", "code_postal"],
            "reference_fields": {"proprietaire_id": "proprietaires"}
        },
        "locaux": {
            "required_fields": ["nom", "type"],
            "optional_fields": ["adresse", "surface", "pieces", "immeuble_id", "etage"],
            "reference_fields": {"immeuble_id": "immeubles"},
            "type_values": ["appartement", "maison", "bureau", "commerce", "local commercial"]
        },
        "locataires": {
            "required_fields": ["prenom", "nom"],
            "optional_fields": ["email", "telephone", "adresse", "date_naissance", "profession"],
            "email_pattern": r'^[\w\.-]+@[\w\.-]+\.\w+$',
            "phone_pattern": r'^[\d\s\+\-\(\)]+$'
        },
        "contrats": {
            "required_fields": ["local_id", "locataire_id", "date_debut", "loyer"],
            "optional_fields": ["date_fin", "charges", "depot_garantie", "type_contrat"],
            "reference_fields": {
                "local_id": "locaux",
                "locataire_id": "locataires"
            },
            "date_fields": ["date_debut", "date_fin"],
            "amount_fields": ["loyer", "charges", "depot_garantie"]
        },
        "loyers": {
            "required_fields": ["contrat_id", "mois", "annee", "montant"],
            "optional_fields": ["statut", "date_paiement"],
            "reference_fields": {"contrat_id": "contrats"},
            "amount_fields": ["montant"],
            "status_values": ["en_attente", "paye", "impaye", "partiel"]
        },
        "paiements": {
            "required_fields": ["contrat_id", "montant", "date"],
            "optional_fields": ["methode", "reference", "notes"],
            "reference_fields": {"contrat_id": "contrats"},
            "amount_fields": ["montant"],
            "date_fields": ["date"],
            "method_values": ["especes", "cheque", "virement", "carte", "mobile_money"]
        },
        "charges": {
            "required_fields": ["contrat_id", "type", "montant"],
            "optional_fields": ["periode", "statut"],
            "reference_fields": {"contrat_id": "contrats"},
            "amount_fields": ["montant"],
            "type_values": ["eau", "electricite", "gaz", "ordures", "copropriete", "entretien"]
        }
    }
    
    # Mapping des champs legacy → nouveau système
    FIELD_MAPPINGS = {
        "proprietaires": {
            "id": "id",
            "nom": "company_name",
            "contact": "contact_name",
            "email": "email",
            "telephone": "phone",
            "adresse": "address",
            "ville": "city",
            "code_postal": "postal_code"
        },
        "immeubles": {
            "id": "id",
            "nom": "name",
            "adresse": "address",
            "proprietaire_id": "owner_id",
            "ville": "city"
        },
        "locaux": {
            "id": "id",
            "nom": "name",
            "type": "type",
            "adresse": "address",
            "surface": "surface_area",
            "pieces": "rooms",
            "immeuble_id": "site_id",
            "etage": "floor"
        },
        "locataires": {
            "id": "id",
            "prenom": "first_name",
            "nom": "last_name",
            "email": "email",
            "telephone": "phone",
            "adresse": "address",
            "date_naissance": "birth_date",
            "profession": "occupation"
        },
        "contrats": {
            "id": "id",
            "local_id": "property_id",
            "locataire_id": "tenant_id",
            "date_debut": "start_date",
            "date_fin": "end_date",
            "loyer": "rent_amount",
            "charges": "charges_amount",
            "depot_garantie": "security_deposit",
            "type_contrat": "contract_type"
        },
        "paiements": {
            "id": "id",
            "contrat_id": "contract_id",
            "montant": "amount",
            "date": "payment_date",
            "methode": "payment_method",
            "reference": "reference",
            "notes": "notes"
        }
    }
    
    def __init__(self, analysis_report_path: str):
        """Initialise le catégoriseur avec le rapport d'analyse"""
        self.report_path = Path(analysis_report_path)
        self.analysis_report = self._load_analysis_report()
        self.validation_results = {
            "total_records": 0,
            "valid_records": 0,
            "invalid_records": 0,
            "warnings_count": 0,
            "by_category": {},
            "errors_summary": {},
            "start_time": datetime.now().isoformat()
        }
        self.categorized_data = {}
        self.reference_ids = {}  # Pour validation des FK
    
    def _load_analysis_report(self) -> Dict:
        """Charge le rapport d'analyse"""
        if not self.report_path.exists():
            raise FileNotFoundError(f"Rapport d'analyse introuvable: {self.report_path}")
        
        with open(self.report_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def categorize_and_validate(self) -> Dict[str, Any]:
        """Lance la catégorisation et validation complètes"""
        print("=" * 80)
        print("🏷️  AKIG - CATÉGORISATION ET VALIDATION DES DONNÉES")
        print("=" * 80)
        print(f"\n⏰ Début: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        categories = self.analysis_report.get("categories", {})
        
        if not categories:
            print("❌ Aucune catégorie trouvée dans le rapport d'analyse")
            return self.validation_results
        
        print(f"📦 {len(categories)} catégories à traiter\n")
        
        # Ordre de traitement (pour respecter les dépendances FK)
        processing_order = [
            "proprietaires",
            "immeubles",
            "locaux",
            "locataires",
            "contrats",
            "loyers",
            "paiements",
            "charges",
            "quittances",
            "documents"
        ]
        
        for category in processing_order:
            if category in categories:
                print(f"\n{'='*60}")
                print(f"📂 Traitement: {category.upper()}")
                print(f"{'='*60}")
                self._process_category(category, categories[category])
        
        # Traiter les catégories non prévues
        for category in categories:
            if category not in processing_order:
                print(f"\n⚠️  Catégorie non standard: {category}")
                self._process_category(category, categories[category])
        
        # Génération des rapports
        self._generate_validation_report()
        self._generate_categorized_files()
        
        return self.validation_results
    
    def _process_category(self, category: str, data: Any):
        """Traite une catégorie de données"""
        print(f"\n🔍 Analyse de la catégorie: {category}")
        
        records = self._extract_records(data)
        
        if not records:
            print(f"  ⚠️  Aucune donnée à traiter")
            return
        
        print(f"  📊 {len(records)} enregistrements à valider")
        
        validated_records = []
        errors_in_category = []
        warnings_in_category = []
        
        for idx, record in enumerate(records, 1):
            result = self._validate_record(category, record, idx)
            
            if result.is_valid:
                validated_records.append(result)
                self.validation_results["valid_records"] += 1
                
                # Collecter les IDs pour validation FK
                if "id" in result.data:
                    if category not in self.reference_ids:
                        self.reference_ids[category] = set()
                    self.reference_ids[category].add(str(result.data["id"]))
            else:
                self.validation_results["invalid_records"] += 1
                errors_in_category.extend(result.errors)
            
            if result.warnings:
                warnings_in_category.extend(result.warnings)
                self.validation_results["warnings_count"] += len(result.warnings)
            
            self.validation_results["total_records"] += 1
            
            # Afficher progression
            if idx % 100 == 0:
                print(f"  ⏳ Progression: {idx}/{len(records)}")
        
        # Stocker les données validées
        self.categorized_data[category] = [r.transformed_data for r in validated_records]
        
        # Résumé de la catégorie
        self.validation_results["by_category"][category] = {
            "total": len(records),
            "valid": len(validated_records),
            "invalid": len(records) - len(validated_records),
            "warnings": len(warnings_in_category),
            "errors_sample": errors_in_category[:10]
        }
        
        print(f"\n  ✅ Résultats:")
        print(f"    • Valides: {len(validated_records)}/{len(records)}")
        print(f"    • Invalides: {len(records) - len(validated_records)}")
        print(f"    • Avertissements: {len(warnings_in_category)}")
    
    def _extract_records(self, data: Any) -> List[Dict]:
        """Extrait les enregistrements du format de données"""
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            if "sample" in data:
                return data["sample"]
            elif "count" in data and "sample" in data:
                return data["sample"]
            else:
                # Essayer de détecter une liste dans le dict
                for key, value in data.items():
                    if isinstance(value, list):
                        return value
        return []
    
    def _validate_record(self, category: str, record: Dict, index: int) -> ValidationResult:
        """Valide un enregistrement"""
        errors = []
        warnings = []
        
        rules = self.VALIDATION_RULES.get(category, {})
        
        # 1. Vérifier les champs requis
        required_fields = rules.get("required_fields", [])
        for field in required_fields:
            if field not in record or not record[field]:
                errors.append(f"Champ requis manquant: {field}")
        
        # 2. Valider les patterns (email, téléphone)
        if "email_pattern" in rules and "email" in record and record["email"]:
            if not re.match(rules["email_pattern"], record["email"]):
                warnings.append(f"Format email invalide: {record['email']}")
        
        if "phone_pattern" in rules and "telephone" in record and record["telephone"]:
            if not re.match(rules["phone_pattern"], str(record["telephone"])):
                warnings.append(f"Format téléphone suspect: {record['telephone']}")
        
        # 3. Valider les valeurs énumérées
        for enum_field in ["type_values", "status_values", "method_values"]:
            if enum_field in rules:
                field_name = enum_field.replace("_values", "")
                if field_name in record and record[field_name]:
                    value = str(record[field_name]).lower()
                    if value not in rules[enum_field]:
                        warnings.append(f"Valeur inattendue pour {field_name}: {value}")
        
        # 4. Valider les montants
        amount_fields = rules.get("amount_fields", [])
        for field in amount_fields:
            if field in record and record[field]:
                try:
                    amount = float(str(record[field]).replace(",", "."))
                    if amount < 0:
                        errors.append(f"Montant négatif: {field} = {amount}")
                except (ValueError, TypeError):
                    errors.append(f"Montant invalide: {field} = {record[field]}")
        
        # 5. Valider les dates
        date_fields = rules.get("date_fields", [])
        for field in date_fields:
            if field in record and record[field]:
                if not self._is_valid_date(record[field]):
                    warnings.append(f"Format de date suspect: {field} = {record[field]}")
        
        # 6. Valider les références FK
        reference_fields = rules.get("reference_fields", {})
        for field, ref_category in reference_fields.items():
            if field in record and record[field]:
                ref_id = str(record[field])
                if ref_category in self.reference_ids:
                    if ref_id not in self.reference_ids[ref_category]:
                        warnings.append(f"Référence FK introuvable: {field} = {ref_id} (vers {ref_category})")
        
        # Transformer les données vers le nouveau schéma
        transformed_data = self._transform_record(category, record)
        
        is_valid = len(errors) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            category=category,
            data=record,
            transformed_data=transformed_data
        )
    
    def _is_valid_date(self, date_value: Any) -> bool:
        """Vérifie si une date est valide"""
        if not date_value:
            return True
        
        date_str = str(date_value)
        
        # Patterns de dates courants
        patterns = [
            r'^\d{4}-\d{2}-\d{2}$',  # YYYY-MM-DD
            r'^\d{2}/\d{2}/\d{4}$',  # DD/MM/YYYY
            r'^\d{2}-\d{2}-\d{4}$',  # DD-MM-YYYY
        ]
        
        return any(re.match(pattern, date_str) for pattern in patterns)
    
    def _transform_record(self, category: str, record: Dict) -> Dict:
        """Transforme un enregistrement vers le nouveau schéma"""
        mapping = self.FIELD_MAPPINGS.get(category, {})
        
        transformed = {}
        
        for old_field, new_field in mapping.items():
            if old_field in record:
                value = record[old_field]
                
                # Nettoyage des valeurs
                if isinstance(value, str):
                    value = value.strip()
                
                transformed[new_field] = value
        
        # Ajouter metadata
        transformed["_imported_at"] = datetime.now().isoformat()
        transformed["_source"] = "legacy_import"
        transformed["_category"] = category
        
        return transformed
    
    def _generate_validation_report(self):
        """Génère le rapport de validation"""
        self.validation_results["end_time"] = datetime.now().isoformat()
        
        report_path = Path("c:/AKIG/scripts/legacy-import/validation-report.json")
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.validation_results, f, indent=2, ensure_ascii=False)
        
        print("\n" + "=" * 80)
        print("📊 RAPPORT DE VALIDATION - RÉSUMÉ")
        print("=" * 80)
        print(f"\n✅ Total: {self.validation_results['total_records']} enregistrements")
        print(f"  • Valides: {self.validation_results['valid_records']}")
        print(f"  • Invalides: {self.validation_results['invalid_records']}")
        print(f"  • Avertissements: {self.validation_results['warnings_count']}")
        
        print(f"\n📂 Par catégorie:")
        for category, stats in self.validation_results["by_category"].items():
            success_rate = (stats["valid"] / stats["total"] * 100) if stats["total"] > 0 else 0
            print(f"  • {category}: {stats['valid']}/{stats['total']} ({success_rate:.1f}%)")
        
        print(f"\n💾 Rapport sauvegardé: {report_path}")
    
    def _generate_categorized_files(self):
        """Génère les fichiers de données catégorisées"""
        output_dir = Path("c:/AKIG/scripts/legacy-import/categorized-data")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print("\n📁 Génération des fichiers catégorisés...")
        
        for category, records in self.categorized_data.items():
            if not records:
                continue
            
            # Fichier JSON
            json_path = output_dir / f"{category}.json"
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(records, f, indent=2, ensure_ascii=False)
            
            print(f"  ✓ {json_path.name}: {len(records)} enregistrements")
        
        print(f"\n✨ Fichiers générés dans: {output_dir}")

def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python categorize-data.py <analysis-report.json>")
        sys.exit(1)
    
    report_path = sys.argv[1]
    
    categorizer = DataCategorizer(report_path)
    categorizer.categorize_and_validate()

if __name__ == "__main__":
    main()
