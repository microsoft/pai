import sys
import os
import codecs
import urlparse
import markdown # https://python-markdown.github.io/


class LinkChecker(markdown.treeprocessors.Treeprocessor):
    def __init__(self, dir_name, file_name, *args, **kwargs):
        markdown.treeprocessors.Treeprocessor.__init__(self, *args, **kwargs)

        self.dir_name = dir_name
        self.file_name = file_name
        self.has_error = False

    def run(self, root):
        for node in root.iter():
            if node.tag == "a":
                link = node.get("href")
                url = urlparse.urlparse(link)

                # TODO check remot links
                if url.scheme == "" and url.netloc == "": # local link
                    path = os.path.join(self.dir_name, url.path)
                    if url.path == "" and url.fragment != "":
                        # ignore current file fragment checks
                        continue

                    if not os.path.exists(path):
                        sys.stderr.write("Error: %s has broken link %s\n" %
                                (os.path.join(self.dir_name, self.file_name), link))
                        self.has_error = True


class LinkCheckerExtension(markdown.Extension):
    def __init__(self, dir_name, file_name, *args, **kwargs):
        markdown.Extension.__init__(self, *args, **kwargs)

        self.dir_name = dir_name
        self.file_name = file_name

    def extendMarkdown(self, md, md_globals):
        md.treeprocessors.add(
            "link_checker", LinkChecker(self.dir_name, self.file_name, md), ">inline")


def check(doc_path):
    """ check doc file in `doc_path`. return True on error occurs,
    broken links will be outputed to stderr """
    dir_name = os.path.dirname(doc_path)
    file_name = os.path.basename(doc_path)

    md = markdown.Markdown(extensions=[LinkCheckerExtension(dir_name, file_name)])
    with codecs.open(doc_path, "r", "utf-8") as f:
        md.convert(f.read())

    return md.treeprocessors.get("link_checker").has_error


def check_all(doc_root):
    """ check_all iteratively checks docs link. return True on error occurs,
    broken links will be outputed to stderr """
    has_error = False
    for root, dirs, files in os.walk(doc_root):
        for name in files:
            if name.endswith(".md"):
                path = os.path.join(root, name)
                if "/vendor/" in path:
                    # ignore 3rd party markdown check
                    continue

                md = markdown.Markdown(extensions=[LinkCheckerExtension(root, name)])
                with codecs.open(path, "r", "utf-8") as f:
                    sys.stdout.write("analyzing %s\n" % path)
                    md.convert(f.read())
                has_error = has_error or md.treeprocessors.get("link_checker").has_error
    return has_error


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.stderr.write("Usage: doc_checker.py (doc_dir|doc_file)\n")
        sys.exit(1)

    doc_root = os.path.abspath(sys.argv[1])

    if os.path.isdir(doc_root):
        has_error = check_all(doc_root)
    else:
        has_error = check(doc_root)

    if has_error:
        sys.exit(2)
    else:
        sys.exit(0)
