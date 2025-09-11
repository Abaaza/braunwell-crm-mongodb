// jest.setup.js
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test.convex.cloud'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock Next.js server components
global.Request = class Request {
  constructor(input, init) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init?.method || 'GET'
    this.headers = new Map()
    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value)
      })
    }
  }
  
  get ip() {
    return '127.0.0.1'
  }
  
  get nextUrl() {
    return new URL(this.url)
  }
}

global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Map()
    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value)
      })
    }
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body))
  }
}

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: global.Request,
  NextResponse: {
    json: (data, init) => new global.Response(JSON.stringify(data), init),
    next: () => ({
      headers: {
        set: jest.fn(),
      },
    }),
  },
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      route: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  useParams() {
    return {}
  },
  redirect: jest.fn(),
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function Link({ children, href, ...props }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useAction: jest.fn(),
  ConvexProvider: ({ children }) => children,
  ConvexReactClient: jest.fn(),
}))

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Users: ({ ...props }) => <svg {...props} data-testid="users-icon">users</svg>,
  Calendar: ({ ...props }) => <svg {...props} data-testid="calendar-icon">calendar</svg>,
  DollarSign: ({ ...props }) => <svg {...props} data-testid="dollar-sign-icon">dollar</svg>,
  Activity: ({ ...props }) => <svg {...props} data-testid="activity-icon">activity</svg>,
  TrendingUp: ({ ...props }) => <svg {...props} data-testid="trending-up-icon">trending-up</svg>,
  TrendingDown: ({ ...props }) => <svg {...props} data-testid="trending-down-icon">trending-down</svg>,
  ChevronRight: ({ ...props }) => <svg {...props} data-testid="chevron-right-icon">chevron-right</svg>,
  Plus: ({ ...props }) => <svg {...props} data-testid="plus-icon">plus</svg>,
  Search: ({ ...props }) => <svg {...props} data-testid="search-icon">search</svg>,
  Filter: ({ ...props }) => <svg {...props} data-testid="filter-icon">filter</svg>,
  Download: ({ ...props }) => <svg {...props} data-testid="download-icon">download</svg>,
  Upload: ({ ...props }) => <svg {...props} data-testid="upload-icon">upload</svg>,
  Edit: ({ ...props }) => <svg {...props} data-testid="edit-icon">edit</svg>,
  Trash2: ({ ...props }) => <svg {...props} data-testid="trash-icon">trash</svg>,
  MoreHorizontal: ({ ...props }) => <svg {...props} data-testid="more-icon">more</svg>,
  X: ({ ...props }) => <svg {...props} data-testid="x-icon">x</svg>,
  Check: ({ ...props }) => <svg {...props} data-testid="check-icon">check</svg>,
  AlertCircle: ({ ...props }) => <svg {...props} data-testid="alert-circle-icon">alert</svg>,
  Info: ({ ...props }) => <svg {...props} data-testid="info-icon">info</svg>,
  Settings: ({ ...props }) => <svg {...props} data-testid="settings-icon">settings</svg>,
  User: ({ ...props }) => <svg {...props} data-testid="user-icon">user</svg>,
  Building: ({ ...props }) => <svg {...props} data-testid="building-icon">building</svg>,
  Mail: ({ ...props }) => <svg {...props} data-testid="mail-icon">mail</svg>,
  Phone: ({ ...props }) => <svg {...props} data-testid="phone-icon">phone</svg>,
  MapPin: ({ ...props }) => <svg {...props} data-testid="map-pin-icon">map-pin</svg>,
  Globe: ({ ...props }) => <svg {...props} data-testid="globe-icon">globe</svg>,
  Calendar: ({ ...props }) => <svg {...props} data-testid="calendar-icon">calendar</svg>,
  Clock: ({ ...props }) => <svg {...props} data-testid="clock-icon">clock</svg>,
  FileText: ({ ...props }) => <svg {...props} data-testid="file-text-icon">file-text</svg>,
  Folder: ({ ...props }) => <svg {...props} data-testid="folder-icon">folder</svg>,
  Tag: ({ ...props }) => <svg {...props} data-testid="tag-icon">tag</svg>,
  Star: ({ ...props }) => <svg {...props} data-testid="star-icon">star</svg>,
  Heart: ({ ...props }) => <svg {...props} data-testid="heart-icon">heart</svg>,
  Eye: ({ ...props }) => <svg {...props} data-testid="eye-icon">eye</svg>,
  EyeOff: ({ ...props }) => <svg {...props} data-testid="eye-off-icon">eye-off</svg>,
  Lock: ({ ...props }) => <svg {...props} data-testid="lock-icon">lock</svg>,
  Unlock: ({ ...props }) => <svg {...props} data-testid="unlock-icon">unlock</svg>,
  Key: ({ ...props }) => <svg {...props} data-testid="key-icon">key</svg>,
  Shield: ({ ...props }) => <svg {...props} data-testid="shield-icon">shield</svg>,
  Home: ({ ...props }) => <svg {...props} data-testid="home-icon">home</svg>,
  Menu: ({ ...props }) => <svg {...props} data-testid="menu-icon">menu</svg>,
  ArrowLeft: ({ ...props }) => <svg {...props} data-testid="arrow-left-icon">arrow-left</svg>,
  ArrowRight: ({ ...props }) => <svg {...props} data-testid="arrow-right-icon">arrow-right</svg>,
  ArrowUp: ({ ...props }) => <svg {...props} data-testid="arrow-up-icon">arrow-up</svg>,
  ArrowDown: ({ ...props }) => <svg {...props} data-testid="arrow-down-icon">arrow-down</svg>,
  RefreshCw: ({ ...props }) => <svg {...props} data-testid="refresh-icon">refresh</svg>,
  RotateCcw: ({ ...props }) => <svg {...props} data-testid="rotate-ccw-icon">rotate-ccw</svg>,
  Save: ({ ...props }) => <svg {...props} data-testid="save-icon">save</svg>,
  Copy: ({ ...props }) => <svg {...props} data-testid="copy-icon">copy</svg>,
  ExternalLink: ({ ...props }) => <svg {...props} data-testid="external-link-icon">external-link</svg>,
  Link: ({ ...props }) => <svg {...props} data-testid="link-icon">link</svg>,
  Unlink: ({ ...props }) => <svg {...props} data-testid="unlink-icon">unlink</svg>,
  Share: ({ ...props }) => <svg {...props} data-testid="share-icon">share</svg>,
  BookOpen: ({ ...props }) => <svg {...props} data-testid="book-open-icon">book-open</svg>,
  HelpCircle: ({ ...props }) => <svg {...props} data-testid="help-circle-icon">help-circle</svg>,
  MessageCircle: ({ ...props }) => <svg {...props} data-testid="message-circle-icon">message-circle</svg>,
  Send: ({ ...props }) => <svg {...props} data-testid="send-icon">send</svg>,
  Paperclip: ({ ...props }) => <svg {...props} data-testid="paperclip-icon">paperclip</svg>,
  Image: ({ ...props }) => <svg {...props} data-testid="image-icon">image</svg>,
  Video: ({ ...props }) => <svg {...props} data-testid="video-icon">video</svg>,
  Music: ({ ...props }) => <svg {...props} data-testid="music-icon">music</svg>,
  PlayCircle: ({ ...props }) => <svg {...props} data-testid="play-circle-icon">play-circle</svg>,
  PauseCircle: ({ ...props }) => <svg {...props} data-testid="pause-circle-icon">pause-circle</svg>,
  Volume2: ({ ...props }) => <svg {...props} data-testid="volume-icon">volume</svg>,
  VolumeX: ({ ...props }) => <svg {...props} data-testid="volume-x-icon">volume-x</svg>,
  Maximize: ({ ...props }) => <svg {...props} data-testid="maximize-icon">maximize</svg>,
  Minimize: ({ ...props }) => <svg {...props} data-testid="minimize-icon">minimize</svg>,
  Zap: ({ ...props }) => <svg {...props} data-testid="zap-icon">zap</svg>,
  Lightbulb: ({ ...props }) => <svg {...props} data-testid="lightbulb-icon">lightbulb</svg>,
  Sun: ({ ...props }) => <svg {...props} data-testid="sun-icon">sun</svg>,
  Moon: ({ ...props }) => <svg {...props} data-testid="moon-icon">moon</svg>,
  CloudRain: ({ ...props }) => <svg {...props} data-testid="cloud-rain-icon">cloud-rain</svg>,
  Thermometer: ({ ...props }) => <svg {...props} data-testid="thermometer-icon">thermometer</svg>,
  Wifi: ({ ...props }) => <svg {...props} data-testid="wifi-icon">wifi</svg>,
  WifiOff: ({ ...props }) => <svg {...props} data-testid="wifi-off-icon">wifi-off</svg>,
  Bluetooth: ({ ...props }) => <svg {...props} data-testid="bluetooth-icon">bluetooth</svg>,
  Smartphone: ({ ...props }) => <svg {...props} data-testid="smartphone-icon">smartphone</svg>,
  Tablet: ({ ...props }) => <svg {...props} data-testid="tablet-icon">tablet</svg>,
  Monitor: ({ ...props }) => <svg {...props} data-testid="monitor-icon">monitor</svg>,
  Printer: ({ ...props }) => <svg {...props} data-testid="printer-icon">printer</svg>,
  Camera: ({ ...props }) => <svg {...props} data-testid="camera-icon">camera</svg>,
  Headphones: ({ ...props }) => <svg {...props} data-testid="headphones-icon">headphones</svg>,
  Mic: ({ ...props }) => <svg {...props} data-testid="mic-icon">mic</svg>,
  MicOff: ({ ...props }) => <svg {...props} data-testid="mic-off-icon">mic-off</svg>,
  Battery: ({ ...props }) => <svg {...props} data-testid="battery-icon">battery</svg>,
  BatteryLow: ({ ...props }) => <svg {...props} data-testid="battery-low-icon">battery-low</svg>,
  Power: ({ ...props }) => <svg {...props} data-testid="power-icon">power</svg>,
  PowerOff: ({ ...props }) => <svg {...props} data-testid="power-off-icon">power-off</svg>,
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() {
    // Optionally trigger callback with mock data
  }
  unobserve() {}
  disconnect() {}
}

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOMTestUtils.act is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})