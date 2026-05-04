export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground">
            © 2026 Dental Clinic AI. All rights reserved.
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Về chúng tôi
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Liên hệ
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Chính sách bảo mật
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
