/**
 * 📊 Advanced Market Reporting Service
 * PDF reports, CSV exports, scheduled analytics
 * backend/src/services/market-reporting.service.js
 */

const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

class MarketReportingService {
  static async generateMarketAnalysisReport(locationFilter = null) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      // Fetch market data
      const marketData = await this.fetchMarketData(pool, locationFilter);
      
      // Generate PDF
      const pdfPath = await this.createPDFReport(marketData);
      
      // Cleanup
      await pool.end();
      
      return pdfPath;
    } catch (err) {
      console.error('Erreur rapport PDF:', err);
      throw err;
    }
  }

  static async generateCompetitiveAnalysisReport(propertyId) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      const query = `
        SELECT 
          p.id,
          p.title,
          p.price,
          p.surface,
          p.bedrooms,
          p.location,
          p.property_type,
          p.description,
          p.created_at
        FROM properties p
        WHERE p.id = $1
      `;

      const result = await pool.query(query, [propertyId]);
      
      if (result.rows.length === 0) {
        throw new Error('Propriété non trouvée');
      }

      const property = result.rows[0];

      // Find competitors
      const competitors = await pool.query(`
        SELECT 
          p.id,
          p.title,
          p.price,
          p.surface,
          p.bedrooms,
          p.location,
          ROUND(AVG(p.price) OVER (PARTITION BY p.location), 0) as avg_location_price,
          ROUND(STDDEV(p.price) OVER (PARTITION BY p.location), 0) as price_stddev
        FROM properties p
        WHERE 
          p.location = $1
          AND p.property_type = $2
          AND p.id != $3
          AND ABS(p.price - $4) < ($4 * 0.3)
        LIMIT 5
      `, [property.location, property.property_type, propertyId, property.price]);

      // Generate report
      const reportData = {
        property,
        competitors: competitors.rows,
        analysis: {
          priceComparison: this.analyzePrice(property, competitors.rows),
          competitivePosition: this.getCompetitivePosition(property, competitors.rows),
          recommendations: this.generateRecommendations(property, competitors.rows)
        }
      };

      const pdfPath = await this.createCompetitiveReportPDF(reportData);
      
      await pool.end();
      
      return pdfPath;
    } catch (err) {
      console.error('Erreur rapport compétitif:', err);
      throw err;
    }
  }

  static async exportAnalyticsToCSV(analyticsType = 'market') {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      let data, csvPath;

      if (analyticsType === 'market') {
        data = await this.fetchMarketDataForExport(pool);
        csvPath = await this.writeMarketCSV(data);
      } else if (analyticsType === 'properties') {
        data = await this.fetchPropertiesForExport(pool);
        csvPath = await this.writePropertiesCSV(data);
      } else if (analyticsType === 'performance') {
        data = await this.fetchPerformanceData(pool);
        csvPath = await this.writePerformanceCSV(data);
      }

      await pool.end();
      
      return csvPath;
    } catch (err) {
      console.error('Erreur export CSV:', err);
      throw err;
    }
  }

  static async generateScheduledReports() {
    try {
      const reports = [];

      // Daily market summary
      const marketReport = await this.generateMarketAnalysisReport();
      reports.push({
        type: 'market_daily',
        path: marketReport,
        timestamp: new Date()
      });

      // Weekly competitive analysis
      const competitiveReport = await this.generateWeeklyCompetitiveReport();
      reports.push({
        type: 'competitive_weekly',
        path: competitiveReport,
        timestamp: new Date()
      });

      // Monthly portfolio performance
      const portfolioReport = await this.generateMonthlyPortfolioReport();
      reports.push({
        type: 'portfolio_monthly',
        path: portfolioReport,
        timestamp: new Date()
      });

      // Archive reports
      await this.archiveReports(reports);

      return reports;
    } catch (err) {
      console.error('Erreur rapports programmés:', err);
      throw err;
    }
  }

  // Helper methods
  static async fetchMarketData(pool, locationFilter) {
    let query = `
      SELECT 
        p.location,
        p.property_type,
        COUNT(*) as total_properties,
        ROUND(AVG(p.price), 0) as avg_price,
        ROUND(MIN(p.price), 0) as min_price,
        ROUND(MAX(p.price), 0) as max_price,
        ROUND(STDDEV(p.price), 0) as price_stddev,
        ROUND(AVG(p.surface), 0) as avg_surface,
        COUNT(CASE WHEN p.status = 'SOLD' THEN 1 END) as sold_count,
        COUNT(CASE WHEN p.status = 'AVAILABLE' THEN 1 END) as available_count
      FROM properties p
      WHERE p.created_at >= NOW() - INTERVAL '30 days'
    `;

    const params = [];
    
    if (locationFilter) {
      query += ' AND p.location = $1';
      params.push(locationFilter);
    }

    query += ` GROUP BY p.location, p.property_type ORDER BY total_properties DESC`;

    const result = await pool.query(query, params);
    
    return result.rows;
  }

  static async fetchMarketDataForExport(pool) {
    const query = `
      SELECT 
        id,
        title,
        location,
        property_type,
        price,
        surface,
        bedrooms,
        status,
        created_at,
        updated_at
      FROM properties
      WHERE created_at >= NOW() - INTERVAL '90 days'
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  static async fetchPropertiesForExport(pool) {
    const query = `
      SELECT 
        p.id,
        p.title,
        p.location,
        p.property_type,
        p.price,
        p.surface,
        p.bedrooms,
        p.bathrooms,
        p.status,
        COUNT(CASE WHEN r.status = 'VIEWED' THEN 1 END) as view_count,
        COUNT(CASE WHEN r.status = 'INTERESTED' THEN 1 END) as interested_count,
        p.created_at
      FROM properties p
      LEFT JOIN requests r ON p.id = r.property_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  static async fetchPerformanceData(pool) {
    const query = `
      SELECT 
        DATE(p.created_at) as date,
        COUNT(*) as total_views,
        COUNT(DISTINCT p.id) as unique_properties,
        ROUND(AVG(p.price), 0) as avg_price,
        COUNT(CASE WHEN p.status = 'SOLD' THEN 1 END) as sold_count,
        ROUND(
          COUNT(CASE WHEN p.status = 'SOLD' THEN 1 END) * 100.0 / COUNT(*),
          2
        ) as conversion_rate
      FROM properties p
      GROUP BY DATE(p.created_at)
      ORDER BY date DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  static async createPDFReport(marketData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ bufferPages: true });
        
        const fileName = `market_report_${Date.now()}.pdf`;
        const filePath = path.join(process.cwd(), 'reports', fileName);
        
        // Ensure reports directory exists
        if (!fs.existsSync(path.join(process.cwd(), 'reports'))) {
          fs.mkdirSync(path.join(process.cwd(), 'reports'), { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Header
        doc.fontSize(24).font('Helvetica-Bold')
          .text('📊 RAPPORT ANALYSE MARCHÉ AKIG', { align: 'center' });
        
        doc.fontSize(12).font('Helvetica')
          .text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, { align: 'center' })
          .moveDown();

        // Summary
        doc.fontSize(14).font('Helvetica-Bold')
          .text('Résumé Exécutif', { underline: true });
        doc.fontSize(11).font('Helvetica');

        let totalProperties = 0;
        let totalRevenue = 0;

        marketData.forEach(row => {
          totalProperties += row.total_properties;
          totalRevenue += (row.avg_price * row.total_properties);
        });

        doc.text(`Total Propriétés: ${totalProperties}`);
        doc.text(`Revenu Estimé: ${(totalRevenue / 1000000).toFixed(1)}M GNF`);
        doc.moveDown();

        // Market Data Table
        doc.fontSize(12).font('Helvetica-Bold')
          .text('Données Marché par Localisation', { underline: true });
        doc.fontSize(9).font('Helvetica');

        marketData.forEach(row => {
          doc.text(`${row.location} - ${row.property_type}`, { continued: true })
            .text(`: ${row.total_properties} prop. | Prix moyen: ${(row.avg_price / 1000000).toFixed(1)}M GNF`);
        });

        doc.moveDown();
        doc.fontSize(10).text('---Fin du Rapport---', { align: 'center' });

        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  static async createCompetitiveReportPDF(reportData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        
        const fileName = `competitive_report_${Date.now()}.pdf`;
        const filePath = path.join(process.cwd(), 'reports', fileName);

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).font('Helvetica-Bold')
          .text('🏆 ANALYSE CONCURRENTIELLE', { align: 'center' });
        doc.moveDown();

        // Property Info
        const prop = reportData.property;
        doc.fontSize(12).font('Helvetica-Bold').text('Propriété Analysée');
        doc.fontSize(10).font('Helvetica')
          .text(`Titre: ${prop.title}`)
          .text(`Localisation: ${prop.location}`)
          .text(`Prix: ${(prop.price / 1000000).toFixed(1)}M GNF`)
          .text(`Surface: ${prop.surface}m²`)
          .moveDown();

        // Competitive Position
        doc.fontSize(12).font('Helvetica-Bold').text('Position Concurrentielle');
        doc.fontSize(10).font('Helvetica')
          .text(`Position: ${reportData.analysis.competitivePosition}`)
          .moveDown();

        // Competitors
        doc.fontSize(12).font('Helvetica-Bold').text('Propriétés Concurrentes');
        reportData.competitors.forEach((comp, idx) => {
          doc.fontSize(9).text(`${idx + 1}. ${comp.title}`);
          doc.text(`   Prix: ${(comp.price / 1000000).toFixed(1)}M | Surface: ${comp.surface}m² | Chamb: ${comp.bedrooms}`);
        });

        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  static async writeMarketCSV(data) {
    const fileName = `market_data_${Date.now()}.csv`;
    const filePath = path.join(process.cwd(), 'reports', fileName);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'title', title: 'Titre' },
        { id: 'location', title: 'Localisation' },
        { id: 'property_type', title: 'Type' },
        { id: 'price', title: 'Prix (GNF)' },
        { id: 'surface', title: 'Surface (m²)' },
        { id: 'bedrooms', title: 'Chambres' },
        { id: 'status', title: 'Statut' },
        { id: 'created_at', title: 'Créé' }
      ]
    });

    await csvWriter.writeRecords(data);
    return filePath;
  }

  static async writePropertiesCSV(data) {
    const fileName = `properties_${Date.now()}.csv`;
    const filePath = path.join(process.cwd(), 'reports', fileName);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'title', title: 'Titre' },
        { id: 'location', title: 'Localisation' },
        { id: 'price', title: 'Prix' },
        { id: 'view_count', title: 'Vues' },
        { id: 'interested_count', title: 'Intéressés' },
        { id: 'status', title: 'Statut' }
      ]
    });

    await csvWriter.writeRecords(data);
    return filePath;
  }

  static async writePerformanceCSV(data) {
    const fileName = `performance_${Date.now()}.csv`;
    const filePath = path.join(process.cwd(), 'reports', fileName);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'total_views', title: 'Total Vues' },
        { id: 'unique_properties', title: 'Propriétés Uniques' },
        { id: 'avg_price', title: 'Prix Moyen' },
        { id: 'sold_count', title: 'Vendues' },
        { id: 'conversion_rate', title: 'Taux Conversion (%)' }
      ]
    });

    await csvWriter.writeRecords(data);
    return filePath;
  }

  static analyzePrice(property, competitors) {
    if (competitors.length === 0) return { status: 'NO_DATA', recommendation: 'Pas assez de données' };

    const avgCompPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
    const priceDiff = ((property.price - avgCompPrice) / avgCompPrice) * 100;

    if (priceDiff > 15) {
      return { status: 'OVERPRICED', priceDiff, recommendation: 'Réduire le prix' };
    } else if (priceDiff < -15) {
      return { status: 'UNDERPRICED', priceDiff, recommendation: 'Augmenter le prix' };
    }
    
    return { status: 'COMPETITIVE', priceDiff, recommendation: 'Prix compétitif' };
  }

  static getCompetitivePosition(property, competitors) {
    if (competitors.length === 0) return 'Aucun concurrent';
    
    const betterThan = competitors.filter(c => c.price < property.price).length;
    const percentage = (betterThan / competitors.length) * 100;

    if (percentage >= 75) return 'PREMIUM (Plus cher que 75%)';
    if (percentage >= 50) return 'MID-HIGH (Plus cher que 50%)';
    if (percentage >= 25) return 'MID-RANGE (Plus cher que 25%)';
    return 'BUDGET (Moins cher que 75%)';
  }

  static generateRecommendations(property, competitors) {
    const recommendations = [];

    if (competitors.length < 2) {
      recommendations.push('Besoin plus de propriétés concurrentes pour analyse');
    }

    if (property.bedrooms < 2) {
      recommendations.push('Considérer ajouter une chambre pour compétitivité');
    }

    if (competitors.length > 0) {
      const avgPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
      if (property.price > avgPrice * 1.3) {
        recommendations.push('Réduire le prix pour augmenter demande');
      }
    }

    return recommendations;
  }

  static async generateWeeklyCompetitiveReport() {
    // Placeholder for weekly report generation
    return 'weekly_report.pdf';
  }

  static async generateMonthlyPortfolioReport() {
    // Placeholder for monthly report generation
    return 'monthly_report.pdf';
  }

  static async archiveReports(reports) {
    // Archive old reports to storage
    console.log('Rapports archivés:', reports.length);
  }
}

module.exports = MarketReportingService;
