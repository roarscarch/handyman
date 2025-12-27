namespace HandymanMarketplace.Api.Dtos;

public record OrderDto(
    Guid Id,
    string Title,
    decimal Price,
    string Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);


