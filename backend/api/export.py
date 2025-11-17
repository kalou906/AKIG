# backend/api/export.py
"""
API d'export de rapports de solvabilité
- CSV: pour analyse Excel
- PDF: pour rapports imprimables
"""
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
import io
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfgen import canvas as pdf_canvas

router = APIRouter(prefix="/export", tags=["Export"])

# Mock service
class MockSolvencyService:
    async def calculate_score(self, tenant_id: str, detailed: bool = False):
        return {
            'tenant_id': tenant_id,
            'risk_level': 'EXCELLENT',
            'payment_probability': 0.85,
            'confidence_score': 0.92,
            'expected_payment_date': '2025-12-15',
            'badge': '🟢',
            'factors': [
                {'type': 'payment_history', 'severity': 'LOW', 'message': 'Historique excellent'},
                {'type': 'payment_delays', 'severity': 'LOW', 'message': 'Aucun retard récent'},
                {'type': 'outstanding_balance', 'severity': 'MEDIUM', 'message': 'Solde élevé'},
            ]
        }

solvency_service = MockSolvencyService()

@router.get("/tenants/{tenant_id}/csv")
async def export_csv(tenant_id: str):
    """
    Exporter le rapport de solvabilité en CSV
    
    Returns:
        CSV file avec métriques de solvabilité
    """
    try:
        score = await solvency_service.calculate_score(tenant_id, detailed=True)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Tenant not found: {e}")
    
    # Créer CSV en mémoire
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['AKIG - Rapport de Solvabilité'])
    writer.writerow(['Date', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    writer.writerow([])
    
    # Informations principales
    writer.writerow(['Métrique', 'Valeur'])
    writer.writerow(['Tenant ID', tenant_id])
    writer.writerow(['Risk Level', score['risk_level']])
    writer.writerow(['Badge', score.get('badge', '')])
    writer.writerow(['Payment Probability', f"{score['payment_probability']:.2%}"])
    writer.writerow(['Confidence Score', f"{score['confidence_score']:.2%}"])
    writer.writerow(['Expected Payment Date', score.get('expected_payment_date', 'N/A')])
    writer.writerow([])
    
    # Facteurs de risque
    if score.get('factors'):
        writer.writerow(['Facteurs de Risque'])
        writer.writerow(['Type', 'Sévérité', 'Message'])
        for factor in score['factors']:
            writer.writerow([
                factor['type'],
                factor['severity'],
                factor['message']
            ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={tenant_id}_solvency_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )

@router.get("/tenants/{tenant_id}/pdf")
async def export_pdf(tenant_id: str):
    """
    Exporter le rapport de solvabilité en PDF
    
    Returns:
        PDF file avec rapport formaté
    """
    try:
        score = await solvency_service.calculate_score(tenant_id, detailed=True)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Tenant not found: {e}")
    
    # Créer PDF en mémoire
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Style personnalisé
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1890ff'),
        spaceAfter=30,
    )
    
    # Titre
    story.append(Paragraph(f"Rapport de Solvabilité", title_style))
    story.append(Paragraph(f"Tenant ID: <b>{tenant_id}</b>", styles['Heading2']))
    story.append(Paragraph(f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Badge visuel
    badge_map = {
        'EXCELLENT': ('🟢', colors.green),
        'GOOD': ('🟡', colors.yellow),
        'MEDIUM': ('🟠', colors.orange),
        'RISKY': ('🔴', colors.red),
        'CRITICAL': ('⚫', colors.black)
    }
    badge, badge_color = badge_map.get(score['risk_level'], ('⚪', colors.grey))
    
    # Table des métriques principales
    data = [
        ['Métrique', 'Valeur'],
        ['Risk Level', f"{badge} {score['risk_level']}"],
        ['Payment Probability', f"{score['payment_probability']:.2%}"],
        ['Confidence Score', f"{score['confidence_score']:.2%}"],
        ['Expected Payment Date', score.get('expected_payment_date', 'N/A')],
    ]
    
    table = Table(data, colWidths=[3*inch, 3*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1890ff')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
    ]))
    
    story.append(table)
    story.append(Spacer(1, 0.5*inch))
    
    # Facteurs de risque
    if score.get('factors'):
        story.append(Paragraph("Facteurs de Risque", styles['Heading2']))
        story.append(Spacer(1, 0.2*inch))
        
        factors_data = [['Type', 'Sévérité', 'Message']]
        for factor in score['factors']:
            factors_data.append([
                factor['type'],
                factor['severity'],
                factor['message']
            ])
        
        factors_table = Table(factors_data, colWidths=[1.5*inch, 1.5*inch, 3*inch])
        factors_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#52c41a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
        ]))
        
        story.append(factors_table)
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(
        "Généré automatiquement par AKIG AI Solvency System",
        styles['Italic']
    ))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={tenant_id}_solvency_{datetime.now().strftime('%Y%m%d')}.pdf"
        }
    )

@router.get("/dashboard/global/csv")
async def export_global_csv():
    """
    Exporter un rapport CSV global de tous les tenants
    """
    # Mock data - À remplacer par vraie requête DB
    tenants = [
        {'tenant_id': 'demo-tenant-1', 'risk_level': 'EXCELLENT', 'probability': 0.85},
        {'tenant_id': 'demo-tenant-2', 'risk_level': 'GOOD', 'probability': 0.75},
        {'tenant_id': 'demo-tenant-3', 'risk_level': 'RISKY', 'probability': 0.25},
    ]
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=['tenant_id', 'risk_level', 'probability'])
    writer.writeheader()
    writer.writerows(tenants)
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=global_solvency_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )
