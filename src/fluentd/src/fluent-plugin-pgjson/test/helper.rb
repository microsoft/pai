require "bundler/setup"
require "test/unit"

$LOAD_PATH.unshift(File.join(__dir__, "..", "lib"))
$LOAD_PATH.unshift(__dir__)
require "fluent/test"
require "fluent/plugin/out_pgjson"
