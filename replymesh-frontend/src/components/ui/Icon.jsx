import {
  Activity, AlertCircle, AlertTriangle, Archive, ArrowLeft, ArrowRight, Ban,
  BarChart3, Bell, Bot, Building2, ChartNoAxesCombined, Check, CheckCheck,
  CheckCircle2, ChevronDown, ChevronRight, Circle, CircleAlert, CircleCheck,
  Clock, Clock3, Code2, Copy, Cpu, CreditCard, Crown, Database, DollarSign, EllipsisVertical,
  Eye, EyeOff, Filter, Globe, Hexagon, Image, ImagePlus, Info, KeyRound,
  Layers, LayoutDashboard, LifeBuoy, Loader, LoaderCircle, LogIn, LogOut,
  MailPlus, Megaphone, Menu, MessageCircle, MessageSquare, Palette, PauseCircle,
  Pencil, PlugZap, Plus, QrCode, Radar, Receipt, RefreshCcw, RefreshCw, Save,
  ScrollText, Search, Send, Server, Settings, Share2, ShieldAlert, ShoppingBag,
  Smartphone, Sparkles, Star, Store, Trash2, TrendingDown, TrendingUp,
  TriangleAlert, Truck, Unplug, UserPlus, UserRound, Users, Wallet, Webhook, X,
} from "lucide-react";

const icons = {
  Activity, AlertCircle, AlertTriangle, Archive, ArrowLeft, ArrowRight, Ban,
  BarChart3, Bell, Bot, Building2, ChartNoAxesCombined, Check, CheckCheck,
  CheckCircle2, ChevronDown, ChevronRight, Circle, CircleAlert, CircleCheck,
  Clock, Clock3, Code2, Copy, Cpu, CreditCard, Crown, Database, DollarSign, EllipsisVertical,
  Eye, EyeOff, Filter, Globe, Hexagon, Image, ImagePlus, Info, KeyRound,
  Layers, LayoutDashboard, LifeBuoy, Loader, LoaderCircle, LogIn, LogOut,
  MailPlus, Megaphone, Menu, MessageCircle, MessageSquare, Palette, PauseCircle,
  Pencil, PlugZap, Plus, QrCode, Radar, Receipt, RefreshCcw, RefreshCw, Save,
  ScrollText, Search, Send, Server, Settings, Share2, ShieldAlert, ShoppingBag,
  Smartphone, Sparkles, Star, Store, Trash2, TrendingDown, TrendingUp,
  TriangleAlert, Truck, Unplug, UserPlus, UserRound, Users, Wallet, Webhook, X,
};

export function Icon({ name, ...props }) {
  const Component = icons[name] || Circle;
  return <Component {...props} />;
}
