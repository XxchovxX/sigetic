FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/SIGETIC.Domain/SIGETIC.Domain.csproj src/SIGETIC.Domain/
COPY src/SIGETIC.Application/SIGETIC.Application.csproj src/SIGETIC.Application/
COPY src/SIGETIC.Infrastructure/SIGETIC.Infrastructure.csproj src/SIGETIC.Infrastructure/
COPY src/SIGETIC.Api/SIGETIC.Api.csproj src/SIGETIC.Api/
RUN dotnet restore src/SIGETIC.Api/SIGETIC.Api.csproj

COPY src/ src/
RUN dotnet publish src/SIGETIC.Api/SIGETIC.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "SIGETIC.Api.dll"]
