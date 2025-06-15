import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface ExportData {
  title: string
  data: any[]
  columns?: string[]
  metadata?: Record<string, any>
}

class ExportService {
  // Export data as CSV
  exportAsCSV(exportData: ExportData): void {
    const { title, data, columns } = exportData
    
    if (!data || data.length === 0) {
      throw new Error('No data to export')
    }

    // Get column headers
    const headers = columns || Object.keys(data[0])
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        }).join(',')
      )
    ].join('\n')

    // Download file
    this.downloadFile(csvContent, `${title}.csv`, 'text/csv')
  }

  // Export data as Excel
  exportAsExcel(exportData: ExportData): void {
    const { title, data, columns } = exportData
    
    if (!data || data.length === 0) {
      throw new Error('No data to export')
    }

    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data, { header: columns })
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    
    // Write file
    XLSX.writeFile(wb, `${title}.xlsx`)
  }

  // Export technical debt report as PDF
  exportTechnicalDebtPDF(data: {
    organization: string
    reportDate: string
    summary: any
    debtAnalysis: any[]
    recommendations: any[]
  }): void {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.text('Technical Debt Analysis Report', 20, 30)
    
    // Organization and date
    doc.setFontSize(12)
    doc.text(`Organization: ${data.organization}`, 20, 50)
    doc.text(`Report Date: ${data.reportDate}`, 20, 60)
    
    // Executive Summary
    doc.setFontSize(16)
    doc.text('Executive Summary', 20, 80)
    
    doc.setFontSize(10)
    let yPos = 90
    
    if (data.summary) {
      doc.text(`Total Product Areas: ${data.summary.totalProductAreas || 0}`, 20, yPos)
      yPos += 10
      doc.text(`Critical Issues: ${data.summary.criticalIssues || 0}`, 20, yPos)
      yPos += 10
      doc.text(`Technical Debt Score: ${data.summary.technicalDebtScore || 0}`, 20, yPos)
      yPos += 20
    }

    // Technical Debt Analysis Table
    if (data.debtAnalysis && data.debtAnalysis.length > 0) {
      doc.setFontSize(16)
      doc.text('Technical Debt Analysis', 20, yPos)
      yPos += 10

      const tableData = data.debtAnalysis.map(item => [
        item.productArea || '',
        item.debtScore || 0,
        item.category || '',
        item.ticketCounts?.CRITICAL || 0,
        item.ticketCounts?.SEVERE || 0
      ])

      doc.autoTable({
        startY: yPos,
        head: [['Product Area', 'Debt Score', 'Category', 'Critical', 'Severe']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 20
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      doc.setFontSize(16)
      doc.text('Recommendations', 20, yPos)
      yPos += 10

      doc.setFontSize(10)
      data.recommendations.forEach((rec, index) => {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        
        doc.text(`${index + 1}. ${rec.title || rec.recommendation || rec}`, 20, yPos)
        yPos += 10
        
        if (rec.description) {
          const lines = doc.splitTextToSize(rec.description, 170)
          doc.text(lines, 25, yPos)
          yPos += lines.length * 5 + 5
        }
      })
    }

    // Save PDF
    doc.save(`Technical_Debt_Report_${data.organization}_${data.reportDate}.pdf`)
  }

  // Export analytics dashboard as PDF
  exportAnalyticsDashboardPDF(data: {
    organization: string
    reportDate: string
    charts: Array<{
      title: string
      type: string
      data: any
    }>
    summary: any
  }): void {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.text('Analytics Dashboard Report', 20, 30)
    
    // Organization and date
    doc.setFontSize(12)
    doc.text(`Organization: ${data.organization}`, 20, 50)
    doc.text(`Report Date: ${data.reportDate}`, 20, 60)
    
    let yPos = 80

    // Summary section
    if (data.summary) {
      doc.setFontSize(16)
      doc.text('Summary', 20, yPos)
      yPos += 15

      doc.setFontSize(10)
      Object.entries(data.summary).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 20, yPos)
        yPos += 8
      })
      yPos += 10
    }

    // Charts section (simplified text representation)
    data.charts.forEach((chart, index) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.text(chart.title, 20, yPos)
      yPos += 10

      doc.setFontSize(10)
      doc.text(`Chart Type: ${chart.type}`, 20, yPos)
      yPos += 8

      // Add chart data summary
      if (Array.isArray(chart.data)) {
        doc.text(`Data Points: ${chart.data.length}`, 20, yPos)
        yPos += 15
      }
    })

    // Save PDF
    doc.save(`Analytics_Dashboard_${data.organization}_${data.reportDate}.pdf`)
  }

  // Export configuration as JSON
  exportConfiguration(config: any, organization: string): void {
    const configData = {
      organization,
      exportDate: new Date().toISOString(),
      configuration: config
    }

    const jsonContent = JSON.stringify(configData, null, 2)
    this.downloadFile(jsonContent, `Configuration_${organization}.json`, 'application/json')
  }

  // Helper method to download file
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  // Generate shareable dashboard link
  generateShareableLink(organization: string, filters?: any): string {
    const baseUrl = window.location.origin
    const params = new URLSearchParams({
      org: organization,
      ...(filters && { filters: JSON.stringify(filters) })
    })
    
    return `${baseUrl}/analytics?${params.toString()}`
  }

  // Copy to clipboard
  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }
}

export const exportService = new ExportService()
export default exportService
