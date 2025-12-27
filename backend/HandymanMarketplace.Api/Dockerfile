FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/HandymanMarketplace.Api/HandymanMarketplace.Api.csproj backend/HandymanMarketplace.Api/
RUN dotnet restore backend/HandymanMarketplace.Api/HandymanMarketplace.Api.csproj

COPY backend/HandymanMarketplace.Api/ backend/HandymanMarketplace.Api/
RUN dotnet publish backend/HandymanMarketplace.Api/HandymanMarketplace.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# SQLite file lives here (mounted as a named volume in docker-compose).
VOLUME ["/data"]

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "HandymanMarketplace.Api.dll"]


