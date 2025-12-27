using HandymanMarketplace.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HandymanMarketplace.Api.Data;

public class OrdersDbContext : DbContext
{
    public OrdersDbContext(DbContextOptions<OrdersDbContext> options) : base(options)
    {
    }

    public DbSet<Order> Orders => Set<Order>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>(b =>
        {
            b.HasKey(o => o.Id);

            b.Property(o => o.Title)
                .IsRequired()
                .HasMaxLength(200);

            // EF Core maps decimal to TEXT/REAL depending on provider; explicit precision helps consistency.
            b.Property(o => o.Price)
                .HasPrecision(18, 2);

            b.Property(o => o.Status)
                .HasConversion<int>();

            b.Property(o => o.CreatedAtUtc)
                .IsRequired();

            b.Property(o => o.UpdatedAtUtc)
                .IsRequired();
        });
    }
}


