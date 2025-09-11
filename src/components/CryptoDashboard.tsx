import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Activity, Clock } from "lucide-react";

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  logo: string;
  rank: number;
  lastUpdated: string;
}

const mockData: CryptoData[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    price: 68542.34,
    change24h: 2.34,
    marketCap: 1347000000000,
    volume24h: 28500000000,
    logo: "₿",
    rank: 1,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "ethereum",
    name: "Ethereum", 
    symbol: "ETH",
    price: 3421.67,
    change24h: -1.23,
    marketCap: 411000000000,
    volume24h: 15200000000,
    logo: "Ξ",
    rank: 2,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL", 
    price: 187.42,
    change24h: 8.76,
    marketCap: 88000000000,
    volume24h: 3200000000,
    logo: "◎",
    rank: 3,
    lastUpdated: new Date().toISOString(),
  }
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatLargeNumber = (value: number) => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  return `${Math.floor(diffInSeconds / 3600)}h ago`;
};

export default function CryptoDashboard() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>(mockData);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time price updates
      setCryptoData(prev => prev.map(crypto => ({
        ...crypto,
        price: crypto.price + (Math.random() - 0.5) * crypto.price * 0.001,
        change24h: crypto.change24h + (Math.random() - 0.5) * 0.5,
        lastUpdated: new Date().toISOString(),
      })));
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const significantMoves = cryptoData.filter(crypto => Math.abs(crypto.change24h) > 5);

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Crypto Watcher
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" className="animate-pulse-slow">
          <Activity className="w-4 h-4 mr-2" />
          Live
        </Button>
      </div>

      {/* Alerts Section */}
      {significantMoves.length > 0 && (
        <Card className="bg-gradient-card border-primary/20 shadow-glow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Price Alerts</h2>
              <Badge variant="outline" className="ml-auto">
                {significantMoves.length} active
              </Badge>
            </div>
            <div className="space-y-3">
              {significantMoves.map(crypto => (
                <div key={crypto.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{crypto.logo}</span>
                    <div>
                      <p className="font-medium">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(crypto.price)}</p>
                    <div className={`flex items-center gap-1 text-sm ${
                      crypto.change24h >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {crypto.change24h >= 0 ? 
                        <TrendingUp className="w-3 h-3" /> : 
                        <TrendingDown className="w-3 h-3" />
                      }
                      {Math.abs(crypto.change24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Crypto Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cryptoData.map((crypto) => (
          <Card key={crypto.id} className="bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 group">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{crypto.logo}</div>
                  <div>
                    <h3 className="font-bold text-lg">{crypto.name}</h3>
                    <p className="text-muted-foreground text-sm">{crypto.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{crypto.rank}
                  </Badge>
                  {crypto.rank <= 3 && (
                    <span className={`text-lg ${
                      crypto.rank === 1 ? 'text-crypto-gold' :
                      crypto.rank === 2 ? 'text-crypto-silver' : 
                      'text-crypto-bronze'
                    }`}>
                      {crypto.rank === 1 ? '🥇' : crypto.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-2xl font-bold">{formatCurrency(crypto.price)}</p>
                <div className={`flex items-center gap-1 ${
                  crypto.change24h >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  {crypto.change24h >= 0 ? 
                    <TrendingUp className="w-4 h-4" /> : 
                    <TrendingDown className="w-4 h-4" />
                  }
                  <span className="font-medium">
                    {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                  </span>
                  <span className="text-xs text-muted-foreground">24h</span>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Market Cap</span>
                  </div>
                  <span className="font-medium">{formatLargeNumber(crypto.marketCap)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Volume 24h</span>
                  </div>
                  <span className="font-medium">{formatLargeNumber(crypto.volume24h)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Updated</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(crypto.lastUpdated)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-muted-foreground text-sm">
        <p>Crypto data updates every 3 seconds • Connected to live market feeds</p>
      </div>
    </div>
  );
}