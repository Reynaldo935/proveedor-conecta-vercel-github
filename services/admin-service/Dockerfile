FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder

WORKDIR /app

# Copy project file and restore dependencies
COPY admin-service.csproj ./
RUN dotnet restore

# Copy source code
COPY Program.cs ./

# Build the application
RUN dotnet publish -c Release -o out

# Final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine

WORKDIR /app

# Copy the published application
COPY --from=builder /app/out ./

# Expose port
EXPOSE 8082

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8082
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8082/api/admin/health || exit 1

# Run the application
ENTRYPOINT ["dotnet", "admin-service.dll"]
