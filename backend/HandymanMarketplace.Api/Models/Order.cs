namespace HandymanMarketplace.Api.Models;

public class Order
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public decimal Price { get; set; }
    public OrderStatus Status { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}


