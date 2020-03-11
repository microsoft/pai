$:.push File.expand_path("../lib", __FILE__)

Gem::Specification.new do |s|
  s.name        = "fluent-plugin-pgjson"
  s.version     = "1.0.0"
  s.authors     = ["OKUNO Akihiro"]
  s.email       = ["choplin.choplin@gmail.com"]
  s.homepage    = "https://github.com/fluent-plugins-nursery/fluent-plugin-pgjson"
  s.summary     = %q{Fluentd Output Plugin for PostgreSQL JSON Type.}
  s.description = %q{}
  s.license  = "Apache-2.0"

  s.files         = `git ls-files`.split("\n")
  s.test_files    = `git ls-files -- {test,spec,features}/*`.split("\n")
  s.executables   = `git ls-files -- bin/*`.split("\n").map{ |f| File.basename(f) }
  s.require_paths = ["lib"]

  s.add_runtime_dependency "fluentd", ">=1.0.0", "<2"
  s.add_runtime_dependency "pg"
  s.add_development_dependency "test-unit", ">= 3.1.0"
  s.add_development_dependency "rake", ">= 11.0"
end
