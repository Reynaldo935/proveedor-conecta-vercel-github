using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ProveedorConecta.AdminService;

/// <summary>
/// ProveedorConecta Nicaragua - Admin Service
/// .NET 8 Minimal API for dashboard statistics and report generation.
/// </summary>
public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add services
        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            });
        });

        builder.Services.AddEndpointsApiExplorer();

        var app = builder.Build();

        // Use CORS
        app.UseCors();

        // ============================================
        // Health Check
        // ============================================
        app.MapGet("/api/admin/health", () =>
        {
            return Results.Ok(new
            {
                status = "healthy",
                service = "admin-service",
                version = "1.0.0",
                timestamp = DateTime.UtcNow
            });
        });

        // ============================================
        // Dashboard Statistics
        // ============================================
        app.MapGet("/api/admin/stats", () =>
        {
            var stats = new
            {
                success = true,
                data = new
                {
                    users = new
                    {
                        total = 1250,
                        active = 980,
                        newThisMonth = 145,
                        verified = 890,
                        byRole = new
                        {
                            compradores = 620,
                            proveedores = 380,
                            admins = 12,
                            pendientes = 238
                        }
                    },
                    products = new
                    {
                        total = 3420,
                        active = 2890,
                        outOfStock = 156,
                        categories = new[]
                        {
                            new { name = "Construcción", count = 890, percentage = 26.0 },
                            new { name = "Ferretería", count = 720, percentage = 21.1 },
                            new { name = "Electricidad", count = 540, percentage = 15.8 },
                            new { name = "Plomería", count = 380, percentage = 11.1 },
                            new { name = "Pintura", count = 290, percentage = 8.5 },
                            new { name = "Herramientas", count = 350, percentage = 10.2 },
                            new { name = "Otros", count = 350, percentage = 10.2 }
                        }
                    },
                    transactions = new
                    {
                        total = 4560,
                        completed = 3980,
                        pending = 320,
                        cancelled = 180,
                        refunded = 80,
                        totalVolume = 12850000.00,
                        averageTicket = 2817.98,
                        commissionEarned = 385500.00,
                        thisMonth = new
                        {
                            total = 520,
                            volume = 1820000.00,
                            commission = 54600.00
                        }
                    },
                    revenue = new
                    {
                        today = 45200.00,
                        thisWeek = 312000.00,
                        thisMonth = 1820000.00,
                        thisYear = 15600000.00,
                        currency = "NIO"
                    },
                    geography = new
                    {
                        topCities = new[]
                        {
                            new { city = "Managua", users = 480, percentage = 38.4 },
                            new { city = "León", users = 185, percentage = 14.8 },
                            new { city = "Granada", users = 145, percentage = 11.6 },
                            new { city = "Matagalpa", users = 120, percentage = 9.6 },
                            new { city = "Estelí", users = 95, percentage = 7.6 },
                            new { city = "Chinandega", users = 85, percentage = 6.8 },
                            new { city = "Masaya", users = 75, percentage = 6.0 },
                            new { city = "Otros", users = 65, percentage = 5.2 }
                        }
                    },
                    platform = new
                    {
                        uptime = 99.7,
                        avgResponseTime = "245ms",
                        activeConnections = 342,
                        lastUpdated = DateTime.UtcNow
                    }
                }
            };

            return Results.Ok(stats);
        });

        // ============================================
        // PDF Report Generation
        // ============================================
        app.MapGet("/api/admin/reports/pdf", (HttpContext context) =>
        {
            var reportType = context.Request.Query["type"].FirstOrDefault() ?? "general";
            var fromDate = context.Request.Query["from"].FirstOrDefault() ?? DateTime.UtcNow.AddDays(-30).ToString("yyyy-MM-dd");
            var toDate = context.Request.Query["to"].FirstOrDefault() ?? DateTime.UtcNow.ToString("yyyy-MM-dd");

            // Generate a simple PDF-like report
            // In production, this would use QuestPDF for professional PDF generation
            var reportContent = GeneratePdfReport(reportType, fromDate, toDate);

            context.Response.ContentType = "application/pdf";
            context.Response.Headers["Content-Disposition"] = $"attachment; filename=reporte-{reportType}-{DateTime.UtcNow:yyyyMMdd}.pdf";

            return Results.File(reportContent, "application/pdf",
                $"reporte-{reportType}-{DateTime.UtcNow:yyyyMMdd}.pdf");
        });

        // ============================================
        // Excel Report Generation
        // ============================================
        app.MapGet("/api/admin/reports/excel", (HttpContext context) =>
        {
            var reportType = context.Request.Query["type"].FirstOrDefault() ?? "general";
            var fromDate = context.Request.Query["from"].FirstOrDefault() ?? DateTime.UtcNow.AddDays(-30).ToString("yyyy-MM-dd");
            var toDate = context.Request.Query["to"].FirstOrDefault() ?? DateTime.UtcNow.ToString("yyyy-MM-dd");

            // Generate a simple Excel-like report (CSV format for simplicity)
            // In production, this would use ClosedXML for professional Excel generation
            var reportContent = GenerateExcelReport(reportType, fromDate, toDate);

            context.Response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            context.Response.Headers["Content-Disposition"] = $"attachment; filename=reporte-{reportType}-{DateTime.UtcNow:yyyyMMdd}.xlsx";

            return Results.File(reportContent, "text/csv",
                $"reporte-{reportType}-{DateTime.UtcNow:yyyyMMdd}.csv");
        });

        app.Run();
    }

    /// <summary>
    /// Generate a PDF report as byte array.
    /// In production, this would use QuestPDF for professional PDF generation.
    /// Currently generates a simple text-based report.
    /// </summary>
    private static byte[] GeneratePdfReport(string reportType, string fromDate, string toDate)
    {
        var sb = new StringBuilder();
        sb.AppendLine("%PDF-1.4 ProveedorConecta Nicaragua - Reporte");
        sb.AppendLine();
        sb.AppendLine($"REPORTE DE {reportType.ToUpper()}");
        sb.AppendLine($"ProveedorConecta Nicaragua");
        sb.AppendLine($"Período: {fromDate} a {toDate}");
        sb.AppendLine($"Generado: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine(new string('=', 50));
        sb.AppendLine();

        switch (reportType.ToLower())
        {
            case "ventas":
                sb.AppendLine("REPORTE DE VENTAS");
                sb.AppendLine($"Total de transacciones: 520");
                sb.AppendLine($"Volumen total: C$1,820,000.00");
                sb.AppendLine($"Comisiones generadas: C$54,600.00");
                sb.AppendLine($"Ticket promedio: C$3,500.00");
                sb.AppendLine($"Producto más vendido: Cemento Portland");
                sb.AppendLine($"Categoría líder: Construcción (26%)");
                break;

            case "usuarios":
                sb.AppendLine("REPORTE DE USUARIOS");
                sb.AppendLine($"Total de usuarios: 1,250");
                sb.AppendLine($"Usuarios activos: 980");
                sb.AppendLine($"Nuevos registros: 145");
                sb.AppendLine($"Usuarios verificados: 890");
                sb.AppendLine($"Proveedores: 380");
                sb.AppendLine($"Compradores: 620");
                break;

            case "comisiones":
                sb.AppendLine("REPORTE DE COMISIONES");
                sb.AppendLine($"Tasa de comisión: 3%");
                sb.AppendLine($"Comisiones del período: C$54,600.00");
                sb.AppendLine($"Comisiones acumuladas: C$385,500.00");
                sb.AppendLine($"Desglose por categoría:");
                sb.AppendLine($"  - Construcción: C$14,196.00");
                sb.AppendLine($"  - Ferretería: C$11,511.00");
                sb.AppendLine($"  - Electricidad: C$8,610.00");
                sb.AppendLine($"  - Plomería: C$6,046.50");
                sb.AppendLine($"  - Otros: C$14,236.50");
                break;

            default:
                sb.AppendLine("REPORTE GENERAL");
                sb.AppendLine($"Usuarios totales: 1,250");
                sb.AppendLine($"Productos activos: 2,890");
                sb.AppendLine($"Transacciones completadas: 3,980");
                sb.AppendLine($"Volumen total: C$12,850,000.00");
                sb.AppendLine($"Comisiones totales: C$385,500.00");
                sb.AppendLine($"Tiempo de actividad: 99.7%");
                break;
        }

        sb.AppendLine();
        sb.AppendLine(new string('=', 50));
        sb.AppendLine("Fin del reporte - ProveedorConecta Nicaragua");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    /// <summary>
    /// Generate an Excel/CSV report as byte array.
    /// In production, this would use ClosedXML for professional Excel generation.
    /// Currently generates CSV format.
    /// </summary>
    private static byte[] GenerateExcelReport(string reportType, string fromDate, string toDate)
    {
        var sb = new StringBuilder();

        switch (reportType.ToLower())
        {
            case "ventas":
                sb.AppendLine("ID,Fecha,Comprador,Vendedor,Producto,Monto (NIO),Comisión (3%),Pago Vendedor,Estado");
                sb.AppendLine("TXN-001,2026-01-15,usuario-123,vendedor-456,Cemento Portland x10,5000.00,150.00,4850.00,Completada");
                sb.AppendLine("TXN-002,2026-01-16,usuario-124,vendedor-457,Varilla #3 x20,3600.00,108.00,3492.00,Completada");
                sb.AppendLine("TXN-003,2026-01-17,usuario-125,vendedor-458,Pintura Vinilica 5L,2800.00,84.00,2716.00,Completada");
                sb.AppendLine("TXN-004,2026-01-18,usuario-126,vendedor-456,Tubería PVC 4\",1500.00,45.00,1455.00,Pendiente");
                sb.AppendLine("TXN-005,2026-01-19,usuario-127,vendedor-459,Cable THW 12AWG,4200.00,126.00,4074.00,Completada");
                break;

            case "usuarios":
                sb.AppendLine("ID,Nombre,Email,Rol,Ciudad,Estado,Verificado,Fecha Registro");
                sb.AppendLine("USR-001,María López,maria@demo.ni,Proveedor,Managua,Activo,Sí,2025-06-15");
                sb.AppendLine("USR-002,José García,jose@demo.ni,Comprador,León,Activo,Sí,2025-07-20");
                sb.AppendLine("USR-003,Ana Martínez,ana@demo.ni,Proveedor,Granada,Activo,Sí,2025-08-10");
                sb.AppendLine("USR-004,Carlos Reyes,carlos@demo.ni,Comprador,Managua,Pendiente,No,2026-01-05");
                sb.AppendLine("USR-005,Luisa Torres,luisa@demo.ni,Proveedor,Matagalpa,Activo,Sí,2025-09-30");
                break;

            case "comisiones":
                sb.AppendLine("Mes,Transacciones,Volumen (NIO),Comisión (3%),Categoría Principal");
                sb.AppendLine("2025-10,380,C$1,250,000.00,C$37,500.00,Construcción");
                sb.AppendLine("2025-11,420,C$1,480,000.00,C$44,400.00,Construcción");
                sb.AppendLine("2025-12,490,C$1,680,000.00,C$50,400.00,Ferretería");
                sb.AppendLine("2026-01,520,C$1,820,000.00,C$54,600.00,Construcción");
                break;

            default:
                sb.AppendLine("Métrica,Valor");
                sb.AppendLine("Usuarios Totales,1250");
                sb.AppendLine("Usuarios Activos,980");
                sb.AppendLine("Productos Activos,2890");
                sb.AppendLine("Transacciones Completadas,3980");
                sb.AppendLine("Volumen Total (NIO),C$12,850,000.00");
                sb.AppendLine("Comisiones Totales (NIO),C$385,500.00");
                sb.AppendLine("Ticket Promedio (NIO),C$2,817.98");
                sb.AppendLine("Uptime,99.7%");
                break;
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}
