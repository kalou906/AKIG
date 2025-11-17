# backend/workers/celery_app.py
"""
Celery Workers pour tâches asynchrones
- Batch scoring de tenants
- Jobs planifiés (daily scoring)
- Notifications par email
"""
from celery import Celery
from celery.schedules import crontab
import asyncio
from datetime import datetime
import logging

# Configuration Celery
celery_app = Celery(
    'solvency_worker',
    broker='redis://localhost:6379/1',
    backend='redis://localhost:6379/2'
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    result_expires=3600,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max
)

# Planification des tâches
celery_app.conf.beat_schedule = {
    'daily-scoring-job': {
        'task': 'workers.celery_app.daily_scoring_job',
        'schedule': crontab(hour=2, minute=0),  # Tous les jours à 2h
    },
    'hourly-critical-check': {
        'task': 'workers.celery_app.check_critical_tenants',
        'schedule': crontab(minute=0),  # Toutes les heures
    },
}

logger = logging.getLogger(__name__)

# Mock service - À remplacer par l'import réel
class MockSolvencyService:
    async def calculate_score(self, tenant_id: str):
        return {
            'tenant_id': tenant_id,
            'risk_level': 'GOOD',
            'payment_probability': 0.75,
        }

solvency_service = MockSolvencyService()

@celery_app.task(name='batch_score_tenants', bind=True)
def batch_score_tenants(self, tenant_ids: list[str]):
    """
    Scorer plusieurs tenants en batch
    Usage: batch_score_tenants.delay(['tenant1', 'tenant2'])
    """
    async def process():
        results = []
        total = len(tenant_ids)
        
        for idx, tenant_id in enumerate(tenant_ids, 1):
            try:
                score = await solvency_service.calculate_score(tenant_id)
                results.append({
                    'tenant_id': tenant_id,
                    'risk_level': score['risk_level'],
                    'probability': score['payment_probability'],
                    'success': True
                })
                logger.info(f"[{idx}/{total}] Scored {tenant_id}: {score['risk_level']}")
                
                # Mettre à jour la progression
                self.update_state(
                    state='PROGRESS',
                    meta={'current': idx, 'total': total}
                )
            except Exception as e:
                logger.error(f"Failed to score {tenant_id}: {e}")
                results.append({
                    'tenant_id': tenant_id,
                    'error': str(e),
                    'success': False
                })
        
        return {
            'total': total,
            'successful': sum(1 for r in results if r.get('success')),
            'failed': sum(1 for r in results if not r.get('success')),
            'results': results,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    return asyncio.run(process())

@celery_app.task(name='daily_scoring_job')
def daily_scoring_job():
    """
    Job quotidien pour scorer tous les tenants actifs
    Lancé automatiquement à 2h du matin
    """
    async def fetch_all_tenants():
        # Mock - À remplacer par requête DB réelle
        return ['demo-tenant-1', 'demo-tenant-2', 'demo-tenant-3']
    
    tenant_ids = asyncio.run(fetch_all_tenants())
    logger.info(f"Starting daily scoring job for {len(tenant_ids)} tenants")
    
    # Lancer le batch scoring
    result = batch_score_tenants.delay(tenant_ids)
    
    return {
        'task_id': result.id,
        'tenant_count': len(tenant_ids),
        'started_at': datetime.utcnow().isoformat()
    }

@celery_app.task(name='check_critical_tenants')
def check_critical_tenants():
    """
    Vérifier les tenants critiques toutes les heures
    Envoyer des alertes si nécessaire
    """
    async def fetch_critical():
        # Mock - À remplacer par requête DB
        return [
            {'tenant_id': 'critical-1', 'risk_level': 'CRITICAL', 'probability': 0.15},
            {'tenant_id': 'risky-2', 'risk_level': 'RISKY', 'probability': 0.25},
        ]
    
    critical_tenants = asyncio.run(fetch_critical())
    
    if critical_tenants:
        logger.warning(f"Found {len(critical_tenants)} critical/risky tenants")
        
        # Envoyer des notifications (à implémenter)
        for tenant in critical_tenants:
            send_alert_email.delay(
                tenant['tenant_id'],
                tenant['risk_level'],
                tenant['probability']
            )
    
    return {
        'critical_count': len(critical_tenants),
        'checked_at': datetime.utcnow().isoformat()
    }

@celery_app.task(name='send_alert_email')
def send_alert_email(tenant_id: str, risk_level: str, probability: float):
    """
    Envoyer un email d'alerte pour un tenant critique
    """
    logger.info(f"Sending alert for {tenant_id} ({risk_level}, {probability:.2%})")
    
    # Mock - À remplacer par vraie intégration email (SendGrid, etc.)
    email_body = f"""
    ⚠️ ALERTE SOLVABILITÉ
    
    Tenant: {tenant_id}
    Niveau de risque: {risk_level}
    Probabilité de paiement: {probability:.2%}
    
    Action requise: Vérifier le dossier immédiatement.
    """
    
    return {
        'tenant_id': tenant_id,
        'sent': True,
        'timestamp': datetime.utcnow().isoformat()
    }

@celery_app.task(name='export_monthly_report')
def export_monthly_report(month: int, year: int):
    """
    Générer un rapport mensuel CSV/PDF
    Usage: export_monthly_report.delay(11, 2025)
    """
    logger.info(f"Generating report for {month}/{year}")
    
    # Mock - À implémenter avec vraie génération PDF
    return {
        'month': month,
        'year': year,
        'file_path': f'/reports/solvency_report_{year}_{month:02d}.pdf',
        'generated_at': datetime.utcnow().isoformat()
    }

if __name__ == '__main__':
    # Lancer le worker: celery -A workers.celery_app worker --loglevel=info --pool=threads --concurrency=4
    # Lancer le scheduler: celery -A workers.celery_app beat --loglevel=info
    celery_app.start()
