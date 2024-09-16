FROM mcr.microsoft.com/dotnet/sdk:8.0 AS sdk

WORKDIR src/

RUN apt update && apt install curl -y
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash
RUN apt install nodejs -y

ARG BUILD_CONFIGURATION=Release

ADD web.client/ web.client
ADD web.Server/ web.Server
ADD web.sln .

RUN dotnet publish . -c $BUILD_CONFIGURATION -o ./App

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base

WORKDIR /run

COPY --from=sdk /src/App .

ADD cert.pfx .

ENV ASPNETCORE_Kestrel__Certificates__Default__Path=cert.pfx
ENV ASPNETCORE_Kestrel__Certificates__Default__Password=Password

ENTRYPOINT ["dotnet", "web.Server.dll"]