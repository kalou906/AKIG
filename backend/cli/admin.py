# backend/cli/admin.py
"""
CLI Admin pour AKIG Solvency
Commandes:
  - tenant <id>: Afficher le score d'un tenant
  - batch-score <file>: Scorer plusieurs tenants depuis CSV
"""
import typer
import asyncio
from rich.console import Console
from rich.table import Table
from rich.progress import Progress
import csv
from pathlib import Path

app = typer.Typer(help="AKIG Solvency Admin CLI")
console = Console()

# Mock service - À remplacer par l'import réel
class MockSolvencyService:
    async def calculate_score(self, tenant_id: str, detailed: bool = False):
        return {
            'tenant_id': tenant_id,
            'risk_level': 'EXCELLENT' if tenant_id == 'demo-tenant-1' else 'GOOD',
            'payment_probability': 0.85,
            'confidence_score': 0.92,
            'expected_payment_date': '2025-12-15',
            'factors': [
                {'type': 'payment_history', 'severity': 'LOW', 'message': 'Historique excellent'},
                {'type': 'payment_delays', 'severity': 'LOW', 'message': 'Aucun retard'},
            ]
        }

solvency_service = MockSolvencyService()

@app.command()
def tenant(
    tenant_id: str = typer.Argument(..., help="Tenant ID à analyser"),
    detailed: bool = typer.Option(False, "--detailed", "-d", help="Afficher les détails complets")
):
    """Afficher le score de solvabilité d'un tenant"""
    async def run():
        console.print(f"[cyan]🔍 Analyse du tenant: {tenant_id}[/cyan]")
        
        with console.status("[bold green]Calcul du score..."):
            score = await solvency_service.calculate_score(tenant_id, detailed=detailed)
        
        # Table principale
        table = Table(title=f"🎯 Solvency Score - {tenant_id}", show_header=True)
        table.add_column("Métrique", style="cyan", width=25)
        table.add_column("Valeur", style="magenta", width=30)
        
        # Badge avec emoji
        badge_map = {
            'EXCELLENT': '🟢',
            'GOOD': '🟡',
            'MEDIUM': '🟠',
            'RISKY': '🔴',
            'CRITICAL': '⚫'
        }
        badge = badge_map.get(score['risk_level'], '⚪')
        
        table.add_row("Risk Level", f"{badge} {score['risk_level']}")
        table.add_row("Payment Probability", f"{score['payment_probability']:.2%}")
        table.add_row("Confidence Score", f"{score['confidence_score']:.2%}")
        table.add_row("Expected Payment", score.get('expected_payment_date', 'N/A'))
        
        console.print(table)
        
        # Facteurs de risque si détaillé
        if detailed and score.get('factors'):
            console.print("\n[bold yellow]📊 Facteurs de Risque:[/bold yellow]")
            factors_table = Table(show_header=True)
            factors_table.add_column("Type", style="blue")
            factors_table.add_column("Sévérité", style="red")
            factors_table.add_column("Message", style="white")
            
            for factor in score['factors']:
                severity_color = {
                    'LOW': 'green',
                    'MEDIUM': 'yellow',
                    'HIGH': 'orange1',
                    'CRITICAL': 'red'
                }
                color = severity_color.get(factor['severity'], 'white')
                factors_table.add_row(
                    factor['type'],
                    f"[{color}]{factor['severity']}[/{color}]",
                    factor['message']
                )
            
            console.print(factors_table)
    
    asyncio.run(run())

@app.command()
def batch_score(
    file: Path = typer.Argument(..., help="Fichier CSV avec tenant_id en première colonne"),
    output: Path = typer.Option(None, "--output", "-o", help="Fichier de sortie CSV")
):
    """Scorer plusieurs tenants depuis un fichier CSV"""
    async def run():
        if not file.exists():
            console.print(f"[red]❌ Fichier introuvable: {file}[/red]")
            raise typer.Exit(1)
        
        # Lire les tenant IDs
        tenant_ids = []
        with open(file, 'r') as f:
            reader = csv.reader(f)
            next(reader, None)  # Skip header
            for row in reader:
                if row:
                    tenant_ids.append(row[0])
        
        console.print(f"[cyan]📋 {len(tenant_ids)} tenants à scorer[/cyan]\n")
        
        results = []
        with Progress() as progress:
            task = progress.add_task("[green]Scoring en cours...", total=len(tenant_ids))
            
            for tenant_id in tenant_ids:
                try:
                    score = await solvency_service.calculate_score(tenant_id)
                    results.append({
                        'tenant_id': tenant_id,
                        'risk_level': score['risk_level'],
                        'payment_probability': score['payment_probability'],
                        'confidence_score': score['confidence_score'],
                        'status': '✅'
                    })
                except Exception as e:
                    results.append({
                        'tenant_id': tenant_id,
                        'risk_level': 'ERROR',
                        'payment_probability': 0,
                        'confidence_score': 0,
                        'status': f'❌ {str(e)}'
                    })
                
                progress.update(task, advance=1)
        
        # Afficher résultats
        table = Table(title="📊 Batch Scoring Results")
        table.add_column("Tenant ID", style="cyan")
        table.add_column("Risk Level", style="magenta")
        table.add_column("Probability", style="green", justify="right")
        table.add_column("Confidence", style="yellow", justify="right")
        table.add_column("Status", style="white")
        
        for r in results:
            table.add_row(
                r['tenant_id'],
                r['risk_level'],
                f"{r['payment_probability']:.2%}",
                f"{r['confidence_score']:.2%}",
                r['status']
            )
        
        console.print(table)
        
        # Exporter si demandé
        if output:
            with open(output, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=['tenant_id', 'risk_level', 'payment_probability', 'confidence_score', 'status'])
                writer.writeheader()
                writer.writerows(results)
            console.print(f"\n[green]✅ Résultats exportés: {output}[/green]")
        
        # Statistiques
        console.print(f"\n[bold]📈 Statistiques:[/bold]")
        console.print(f"  Total: {len(results)}")
        console.print(f"  Succès: {sum(1 for r in results if r['status'] == '✅')}")
        console.print(f"  Erreurs: {sum(1 for r in results if '❌' in r['status'])}")
    
    asyncio.run(run())

@app.command()
def stats():
    """Afficher les statistiques globales"""
    console.print("[yellow]📊 Statistiques globales - À implémenter[/yellow]")
    console.print("Prochainement: KPIs, distribution des risques, tendances...")

if __name__ == "__main__":
    app()
