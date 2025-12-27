using HandymanMarketplace.Api.Data;
using HandymanMarketplace.Api.Dtos;
using HandymanMarketplace.Api.Hubs;
using HandymanMarketplace.Api.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

var connectionString =
    builder.Configuration.GetConnectionString("Default")
    ?? "Data Source=/data/app.db";

builder.Services.AddDbContext<OrdersDbContext>(options =>
{
    options.UseSqlite(connectionString);
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

// Ensure SQLite file + schema exist (fine for this take-home; migrations can be added later).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OrdersDbContext>();
    db.Database.EnsureCreated();
}

app.MapGet("/", () => Results.Redirect("/swagger"));

app.MapHub<OrdersHub>("/hubs/orders");

var orders = app.MapGroup("/api/orders");

orders.MapGet("", async (OrdersDbContext db, CancellationToken ct) =>
{
    // NOTE: EF Core's SQLite provider cannot translate ORDER BY over DateTimeOffset.
    // Fetch first, then sort in-memory to keep the endpoint compatible with SQLite.
    var list = await db.Orders
        .AsNoTracking()
        .Select(o => new OrderDto(o.Id, o.Title, o.Price, o.Status.ToString(), o.CreatedAtUtc, o.UpdatedAtUtc))
        .ToListAsync(ct);

    list = list
        .OrderByDescending(o => o.CreatedAtUtc)
        .ToList();

    return Results.Ok(list);
});

orders.MapPost("", async (
    CreateOrderRequest req,
    OrdersDbContext db,
    IHubContext<OrdersHub> hub,
    CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Title))
        return Results.BadRequest(new { message = "Title is required." });

    if (req.Price <= 0)
        return Results.BadRequest(new { message = "Price must be > 0." });

    var order = new Order
    {
        Id = Guid.NewGuid(),
        Title = req.Title.Trim(),
        Price = req.Price,
        Status = OrderStatus.New,
        CreatedAtUtc = DateTimeOffset.UtcNow,
        UpdatedAtUtc = DateTimeOffset.UtcNow
    };

    db.Orders.Add(order);
    await db.SaveChangesAsync(ct);

    var dto = new OrderDto(order.Id, order.Title, order.Price, order.Status.ToString(), order.CreatedAtUtc, order.UpdatedAtUtc);
    await hub.Clients.All.SendAsync("OrderUpdated", dto, ct);

    return Results.Created($"/api/orders/{order.Id}", dto);
});

orders.MapPost("{orderId:guid}/in-progress", async (
    Guid orderId,
    OrdersDbContext db,
    IHubContext<OrdersHub> hub,
    CancellationToken ct) =>
{
    var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == orderId, ct);
    if (order is null)
        return Results.NotFound(new { message = "Order not found." });

    if (order.Status != OrderStatus.New)
        return Results.Conflict(new { message = $"Cannot move to InProgress from {order.Status}." });

    order.Status = OrderStatus.InProgress;
    order.UpdatedAtUtc = DateTimeOffset.UtcNow;

    await db.SaveChangesAsync(ct);

    var dto = new OrderDto(order.Id, order.Title, order.Price, order.Status.ToString(), order.CreatedAtUtc, order.UpdatedAtUtc);
    await hub.Clients.All.SendAsync("OrderUpdated", dto, ct);

    return Results.Ok(dto);
});

app.MapPost("/api/webhooks/payment", async (
    PaymentWebhookRequest req,
    HttpRequest httpRequest,
    IConfiguration cfg,
    OrdersDbContext db,
    IHubContext<OrdersHub> hub,
    CancellationToken ct) =>
{
    var expectedKey = cfg["WEBHOOK_API_KEY"];
    if (string.IsNullOrWhiteSpace(expectedKey))
        return Results.Problem("Server is missing WEBHOOK_API_KEY configuration.", statusCode: 500);

    if (!httpRequest.Headers.TryGetValue("X-Webhook-Key", out var providedKey) || providedKey.Count != 1)
        return Results.Unauthorized();

    if (!string.Equals(providedKey[0], expectedKey, StringComparison.Ordinal))
        return Results.Unauthorized();

    var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == req.OrderId, ct);
    if (order is null)
        return Results.NotFound(new { message = "Order not found." });

    // Logical transition: allow marking as Paid from New or InProgress. If already Paid, idempotent.
    if (order.Status != OrderStatus.Paid)
    {
        order.Status = OrderStatus.Paid;
        order.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    var dto = new OrderDto(order.Id, order.Title, order.Price, order.Status.ToString(), order.CreatedAtUtc, order.UpdatedAtUtc);
    await hub.Clients.All.SendAsync("OrderUpdated", dto, ct);

    return Results.Ok(dto);
});

app.Run();
