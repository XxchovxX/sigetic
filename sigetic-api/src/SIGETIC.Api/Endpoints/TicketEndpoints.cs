using System.Security.Claims;
using SIGETIC.Application.Tickets;

namespace SIGETIC.Api.Endpoints;

public static class TicketEndpoints
{
    public static IEndpointRouteBuilder MapTicketEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tickets")
            .WithTags("Tickets")
            .RequireAuthorization("MesaAyuda");

        group.MapGet("/", async (
            ClaimsPrincipal user,
            ITicketService ticketService,
            CancellationToken cancellationToken) =>
        {
            var tickets = await ticketService.GetAllAsync(cancellationToken);

            if (!CanViewAllTickets(user))
            {
                tickets = tickets
                    .Where(ticket => BelongsToCurrentUser(ticket, user))
                    .ToList();
            }

            return Results.Ok(tickets);
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal user,
            ITicketService ticketService,
            CancellationToken cancellationToken) =>
        {
            var ticket = await ticketService.GetByIdAsync(id, cancellationToken);

            if (ticket is null)
            {
                return Results.NotFound(new
                {
                    message = "No se encontró el ticket solicitado."
                });
            }

            if (!CanViewAllTickets(user) && !BelongsToCurrentUser(ticket, user))
            {
                return Results.Forbid();
            }

            return Results.Ok(ticket);
        });

        group.MapPost("/", async (
            CrearTicketRequest request,
            HttpContext httpContext,
            ITicketService ticketService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var ticket = await ticketService.CreateAsync(
                    request,
                    GetActor(httpContext.User),
                    cancellationToken);

                return Results.Created($"/api/tickets/{ticket.Id}", ticket);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new
                {
                    message = exception.Message
                });
            }
        });

        group.MapPatch("/{id:guid}/estado", async (
            Guid id,
            ActualizarEstadoTicketRequest request,
            HttpContext httpContext,
            ITicketService ticketService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var ticket = await ticketService.UpdateEstadoAsync(
                    id,
                    request,
                    GetActor(httpContext.User),
                    cancellationToken);

                return Results.Ok(ticket);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new
                {
                    message = exception.Message
                });
            }
        })
        .RequireAuthorization("TecnicoEscritura");

        group.MapPatch("/{id:guid}/encuesta", async (
            Guid id,
            RegistrarEncuestaTicketRequest request,
            HttpContext httpContext,
            ITicketService ticketService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var ticket = await ticketService.RegistrarEncuestaAsync(
                    id,
                    request,
                    GetActor(httpContext.User),
                    cancellationToken);

                return Results.Ok(ticket);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new
                {
                    message = exception.Message
                });
            }
        });

        group.MapDelete("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal user,
            ITicketService ticketService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                await ticketService.DeleteAsync(
                    id,
                    GetActor(user),
                    cancellationToken);

                return Results.NoContent();
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new
                {
                    message = exception.Message
                });
            }
        })
        .RequireAuthorization("TecnicoEscritura");

        return app;
    }

    private static string GetActor(ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.Name) ??
            user.FindFirstValue(ClaimTypes.Email) ??
            "Sistema";
    }

    private static bool CanViewAllTickets(ClaimsPrincipal user)
    {
        string? role = user.FindFirstValue(ClaimTypes.Role);

        return role is
            "Administrador" or
            "Administrador TIC" or
            "Auxiliar de Sistemas" or
            "Secretario Administrativo Financiero" or
            "Auxiliar Administrativo SAF" or
            "Consulta / Control Interno";
    }

    private static bool BelongsToCurrentUser(
        TicketResponse ticket,
        ClaimsPrincipal user)
    {
        string? name = user.FindFirstValue(ClaimTypes.Name);
        string? email = user.FindFirstValue(ClaimTypes.Email);

        return Matches(ticket.Solicitante, name) ||
            Matches(ticket.Solicitante, email);
    }

    private static bool Matches(string value, string? expected)
    {
        return !string.IsNullOrWhiteSpace(expected) &&
            string.Equals(
                value.Trim(),
                expected.Trim(),
                StringComparison.OrdinalIgnoreCase);
    }
}
